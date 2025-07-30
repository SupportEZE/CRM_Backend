import { Controller, UseInterceptors, Post, Body, Req, UploadedFile, Request } from '@nestjs/common';
import { InsideBannerService } from './inside-banner.service';
@Controller('inside-banner')
export class InsideBannerController {
    constructor(private readonly insideBannerService: InsideBannerService) { }

}
