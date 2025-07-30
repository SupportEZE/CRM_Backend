import { Body, Controller, Get, Post, Req, Res, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CsvService } from './csv.service';
import { AnalyzeCsvDto, GenerateCsvDto, GenerateSampleCsvDto } from './dto/csv.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileUpload } from 'src/interceptors/fileupload.interceptor';

@Controller('csv')
export class CsvController {
  constructor(private readonly csvService: CsvService) { }

  @Post('generate')
  async generateCsv(@Req() req: Request, @Body() params: GenerateCsvDto): Promise<any> {
    return this.csvService.generateCsv(req, params);
  }


  @ApiTags('generate sample csv function')
  @Post('generate-sample-csv')
  async generateSampleCsv(
    @Body() params: GenerateSampleCsvDto,
    @Req() req: Request,
  ) {
    return await this.csvService.generateSampleCsv(req, params);
  }

  @ApiTags('analyze csv data function')
  @UseInterceptors(FileUpload)
  @Post('analyze-csv-data')
  async analyzeCsvData(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() params: AnalyzeCsvDto
  ) {
    return await this.csvService.analyzeCsvData(req, file, params);
  }

}
