import { Body, Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { ReadPaymentDto } from './dto/payment.dto';

@ApiTags('Payment')
@ApiBearerAuth('Authorization')
@Controller('invoice-payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('/read')
    @ApiOperation({ summary: 'Read Unpaid Invoice data' })
    @ApiBody({ type: ReadPaymentDto })
    async read(@Req() req: any, @Body() params: ReadPaymentDto): Promise<ReadPaymentDto> {
        return await this.paymentService.read(req, params);
    }

}
