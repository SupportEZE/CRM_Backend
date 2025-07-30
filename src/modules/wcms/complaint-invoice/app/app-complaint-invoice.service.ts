import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class AppComplaintInvoiceService {
    constructor
        (
            private readonly res: ResponseService,
        ) { }

}