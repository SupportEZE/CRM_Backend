import { Injectable, HttpStatus, Post, Req, Body } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ProductService } from 'src/modules/master/product/web/product.service';
@Injectable()
export class AppSecondaryOrderService {
    constructor(
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
        private readonly productService: ProductService,
    ) { }

}
