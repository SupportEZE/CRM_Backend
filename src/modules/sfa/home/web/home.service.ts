import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  currentMonthNumber,
  currentYear,
  getMonthStartEnd,
  getYearStartEnd,
  toObjectId,
} from 'src/common/utils/common.utils';
import { CustomerService } from 'src/modules/master/customer/default/web/customer.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly res: ResponseService,
    private readonly customerService: CustomerService,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const loginPerson = await this.customerService.detail(req, params);

      let completion = 0;

      if (loginPerson.data.basic_detail) {
        completion += 40;
      }

      if (
        loginPerson.data.doc_detail &&
        Array.isArray(loginPerson.data.doc_detail) &&
        loginPerson.data.doc_detail.length > 0
      ) {
        let totalRows = loginPerson.data.doc_detail.length;
        const docsFields: string[] = global.DOCS_PERCENATGE_INFO;
        let totalColumns = docsFields.length;

        let totalRowScore = 0;

        loginPerson.data.doc_detail.forEach((doc: any) => {
          let validColumns = docsFields.filter(
            (column) =>
              doc.hasOwnProperty(column) &&
              typeof doc[column] === 'string' &&
              doc[column].trim() !== '',
          ).length;

          if (validColumns > 0) {
            let rowScore = validColumns / totalColumns;
            totalRowScore += rowScore;
          }
        });

        completion += (totalRowScore / totalRows) * 30;
      }

      if (loginPerson.data.bank_detail) {
        const bankFields = global.BANK_PERCENATGE_INFO;
        let filledBankFields = bankFields.filter(
          (field: any) => loginPerson.data.bank_detail[field],
        ).length;
        completion += (filledBankFields / bankFields.length) * 30;
      }

      const profile_percent = Math.round(completion) ?? 0;
      return this.res.success('SUCCESS.FETCH', profile_percent);
    } catch (error) {
      throw error;
    }
  }
}
