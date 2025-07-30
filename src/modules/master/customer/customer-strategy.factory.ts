import { Injectable } from '@nestjs/common';
import { CustomerStrategy } from './customer-strategy.interface';
import { OzoneCustomerService } from './ozone/web/ozone-customer.service';
import { AppOzoneCustomerService } from './ozone/app/app-ozone-customer.service';
import { CustomerService } from './default/web/customer.service';
import { AppCustomerService } from './default/app/app-customer.service';

@Injectable()
export class CustomerStrategyFactory {
  constructor(
    private defaultCustomerService: CustomerService,
    private ozoneCustomerService: OzoneCustomerService,
    private appDefaultCustomerService: AppCustomerService,
    private appOzoneCustomerService: AppOzoneCustomerService,
  ) { }

  getStrategy(client: string): CustomerStrategy {
    const clientStr = String(client).trim();
    switch (clientStr) {
      case '6': //'Ozone'
        return this.ozoneCustomerService;
      default:
        return this.defaultCustomerService;
    }
  }

  getAppStrategy(client: string): CustomerStrategy {
    const clientStr = String(client).trim();
    switch (clientStr) {
      case '6':
        return this.appOzoneCustomerService;
      default:
        return this.appDefaultCustomerService;
    }
  }
}
