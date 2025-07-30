import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { AppPaymentService } from './app-payment.service';
import { ReadPaymentDto } from './dto/app-payment.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('App-Payment')
@ApiBearerAuth('Authorization')
@Controller('app-invoice-payment')
export class AppPaymentController {
    constructor(private readonly appPaymentService: AppPaymentService) { }

    @Post('/read')
    @ApiOperation({ summary: 'Read unpaid Invoices' })
    @ApiBody({ type: ReadPaymentDto })
    async read(@Req() req: any, @Body() params: ReadPaymentDto): Promise<ReadPaymentDto> {
        return await this.appPaymentService.read(req, params);
    }
}
