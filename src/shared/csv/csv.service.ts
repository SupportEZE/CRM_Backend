import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';
import { ApiRes } from 'src/common/dto/api-res.dto';
import { convertKeys, findMismatchKeys } from 'src/common/utils/common.utils';
import { ResponseService } from 'src/services/response.service';
import { FormBuilderService } from '../form-builder/form-builder.service';
import { ProductUploadService } from 'src/modules/master/product/product-upload.service';

@Injectable()
export class CsvService {
  private tmpPath = `${process.cwd()}/public/tmp`;

  constructor(
    private readonly res: ResponseService,
    private readonly formBuilderService: FormBuilderService,
    @Inject(forwardRef(() => ProductUploadService))
    private readonly productUploadService: ProductUploadService,

  ) { }

  async generateCsv(req: Request, params: any): Promise<any> {
    try {
      const { filename, data } = params;

      if (!Array.isArray(data) || data.length === 0) {
        return ApiRes.error(400, "No data available to generate CSV");
      }

      let header = convertKeys(Object.keys(data[0])); // Ensure this function works correctly
      const filePath = `${this.tmpPath}/${filename}`;
      const downloadFileName = `public/tmp/${filename}`

      if (!fs.existsSync(this.tmpPath)) {
        fs.mkdirSync(this.tmpPath, { recursive: true });
      }

      // Write headers to the file first
      fs.writeFileSync(filePath, header.join(",") + "\n", "utf8");

      // Return a promise for the CSV writing process
      return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(filePath, { flags: 'a' }); // Append mode
        const csvStream = fastcsv
          .write(data, { headers: false }) // Writing data without headers since they are already written
          .pipe(ws);

        ws.on("finish", () => {

          resolve(this.res.success('CSV.ANALYZED', { filename: downloadFileName }));
          // Uncomment to remove file after generating
          // fs.unlinkSync(filePath);
        });

        ws.on("error", (error) => {
          reject(ApiRes.error(500, "Failed to generate CSV", error));
        });
      });
    } catch (error) {
      return ApiRes.error(500, 'Bad Request', error);
    }
  }
  async readCsv(filePath: string): Promise<any[]> {
    try {
      const results: any[] = [];
      const stream = fs.createReadStream(filePath);
      // Return the promise so that the caller can handle it
      return new Promise((resolve, reject) => {
        stream.pipe(fastcsv.parse({ headers: true }))
          .on('data', (row) => {
            results.push(row);
          })
          .on('end', () => {
            resolve(results); // Resolve the promise with the results when parsing is done
          })
          .on('error', (error) => {
            reject(error); // Reject the promise if there is an error during parsing
          });
      });
    } catch (error) {
      // Catch any unexpected errors and reject the promise with the error message
      throw new Error(`Failed to read CSV: ${error.message}`);
    }
  }

  async analyzeCsvData(req: Request, file: Express.Multer.File, params: any): Promise<any> {
    try {

      params.internalCall = true;
      params.platform = 'web';
      if (!file.mimetype.includes('csv') || !file.originalname.endsWith('.csv')) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'Only CSV files are allowed.');
      }

      let headersForValidation: string[] = [];
      let formData: Record<string, any> = await this.formBuilderService.read(req, params);
      if (formData.form_source === 'static') {
        formData = formData.form_data.filter((row: any) => row.status === 1);
        headersForValidation = formData.map((row: any) => row.required === true ? `${row.label}*` : row.label);
      } else {
        formData = formData.form_data.filter((row: any) => row.is_show && !row?.is_duplicate && row.type !== 'UPLOAD');
        headersForValidation = formData.map((row: any) => row.required === true ? `${row.label}*` : row.label);
      }
      let header: Record<string, any>[] = formData.map((row: any) => {
        return {
          label: row.required === true ? `${row.label}*` : row.label,
          name: row.name,
          type: row.type,
        };
      });

      const results: any[] = [];
      const headers: string[] = [];
      let rowCount = 0;
      const errors: any[] = [];
      let csvResponse: any;

      if (!file) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'No file provided.');
      }

      const stats = fs.statSync(file.path);
      if (stats.size > global.ONE_MB) return this.res.error(HttpStatus.BAD_REQUEST, 'File size exceeds 1MB.');

      const stream = fs.createReadStream(file.path);
      const data: Record<string, any> = await new Promise((resolve, reject) => {
        stream.pipe(fastcsv.parse({ headers: true }))
          .on('headers', (headerRow) => {
            const checkHeaders = findMismatchKeys(headersForValidation, headerRow);
            if (checkHeaders.length > 0) {
              return reject(new Error(`Mismatched headers: ${checkHeaders.join(', ')}`));
            }
            headers.push(...headerRow);
          })
          .on('data', (row) => {
            let convertedRow = { ...row };  // Start with the original row data
            let errorMessages: string[] = [];  // Store errors for the current row

            for (const [key, value] of Object.entries(row)) {
              const headerColumn = header.find((col) => col.label === key);

              if (headerColumn?.type === 'NUMBER') {
                const numValue = Number(value);

                if (isNaN(numValue)) {
                  errorMessages.push(`${key} should be a number, but received: "${value}"`);
                  convertedRow[key] = numValue;  // Convert to NaN or invalid value
                } else {
                  convertedRow[key] = numValue; // Successfully converted to number
                }
              } else {
                if (key.includes('*') && (typeof value === 'string' && value.trim() === '')) {
                  errorMessages.push(`${key} is required but received an empty value`);
                }
                convertedRow[key] = value;
              }
            }

            if (errorMessages.length > 0) {
              convertedRow['Error'] = errorMessages.join(', ');
              errors.push(convertedRow);
            } else {
              results.push(convertedRow);
            }
            rowCount++;

            if (rowCount >= global.ROW_COUNT) {
              reject(new Error('Row count exceeds the limit.'));
              stream.destroy();
            }
          })
          .on('end', async () => {
            if (errors.length > 0) {
              params.filename = `errors${req['user']['_id']}.csv`;
              params.data = errors;
              csvResponse = await this.generateCsv(req, params);
              reject(new Error(`Error in CSV File : ${csvResponse?.data?.filename}`));
            }
            if (results.length === 0) {
              reject(new Error('CSV is empty'));
            }
            resolve({
              header: headers,
              data: results,
              fileSize: stats.size / (1024 * 1024), // File size in MB
              rowCount: rowCount, // Total number of rows processed
              errors: errors, // Include errors (only rows with errors) in the response
              filename: csvResponse?.data?.filename
            });
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, error.message || error);
    }
  }

  async generateSampleCsv(req: Request, params: any): Promise<any> {
    const module_id = req.body['module_id'];
    if(module_id && module_id === 6) {
      return await this.productUploadService.generateProductUploadSampleCSV(req)
    }
    try {
      params.internalCall = true;
      params.platform = 'web';

      let header: string[] = [];
      let data = await this.formBuilderService.read(req, params);

      if (data.form_source === 'static') {
        data = data.form_data.filter((row: any) => row.status === 1);
        header = data.map((row: any) => row.required === true ? `${row.label}*` : row.label);
      } else {
        data = data.form_data.filter((row: any) => row.is_show && !row?.is_duplicate && row.type !== 'UPLOAD')
        header = data.map((row: any) => row.required === true ? `${row.label}*` : row.label);
      }
      
      const basePath = process.cwd();
      const publicFolderPath = `${basePath}/public`;
      const tmpFolderPath = `${publicFolderPath}/tmp`;
      let filePath = `${tmpFolderPath}/sample${req['user']['_id']}.csv`
      if (!fs.existsSync(tmpFolderPath)) fs.mkdirSync(tmpFolderPath, { recursive: true });
      const ws = fs.createWriteStream(filePath);
      filePath = `public/tmp/sample${req['user']['_id']}.csv`
      fastcsv
        .write([header], { headers: false })
        .pipe(ws)
        .on('finish', () => { });
      return this.res.success('CSV.GENERATE', { filename: filePath });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
