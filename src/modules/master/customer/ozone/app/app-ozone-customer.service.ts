import { HttpStatus, Injectable } from '@nestjs/common';
import { CustomerStrategy } from '../../customer-strategy.interface';

@Injectable()
export class AppOzoneCustomerService implements CustomerStrategy {
  constructor() {}
}
