import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SecondaryOrderService } from './secondary-order.service';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { CreateSecondaryCartDto, DeleteSecondaryOrderItemDto, ReadSecondarOrderProductDto, ReadSecondaryCartItemDto, SecondaryOrderAddDto, SecondaryOrderListDto, SecondaryOrderStatusChangeDto } from './dto/secondary-order.dto';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('Order')
@ApiBearerAuth('Authorization')
@Controller('secondary-order')
export class SecondaryOrderController {
    constructor(
        private readonly secondaryOrderService: SecondaryOrderService,
        private readonly sharedProductService: SharedProductService,
    ) { }

    @Post('/fetch-order-dropdowns')
    @ApiOperation({ summary: 'Read Dropdows' })
    async fetchOrderDropdowns(@Req() req: Request, @Body() params: any) {
        return await this.secondaryOrderService.fetchOrderDropdowns(req, params);
    }

    @Post('/read-product')
    @ApiOperation({ summary: 'Read Product' })
    @ApiBody({ type: ReadSecondarOrderProductDto })
    async readProduct(@Req() req: Request, @Body() params: ReadSecondarOrderProductDto): Promise<ReadSecondarOrderProductDto> {
        return this.sharedProductService.readProduct(req, params);
    }

    @Post('/add-cart')
    @ApiOperation({ summary: 'Add Item In Cart' })
    @ApiBody({ type: CreateSecondaryCartDto })
    async addSecondaryOrderCart(@Req() req: Request, @Body() params: CreateSecondaryCartDto) {
        return await this.secondaryOrderService.addSecondaryOrderCart(req, params);
    }

    @Post('/read-cart')
    @ApiOperation({ summary: 'Read Cart List' })
    @ApiBody({ type: ReadSecondaryCartItemDto })
    async readCart(@Req() req: Request, @Body() params: ReadSecondaryCartItemDto) {
        return await this.secondaryOrderService.readCart(req, params);
    }

    @Patch('/delete-cart-item')
    @ApiOperation({ summary: 'Delete cart Item' })
    @ApiBody({ type: _IdDto })
    async deleteCartItem(@Req() req: Request, @Body() params: _IdDto) {
        return await this.secondaryOrderService.deleteCartItem(req, params);
    }

    @Patch('/delete-cart')
    @ApiOperation({ summary: 'Delete Cart' })
    async deleteCart(@Req() req: Request, @Body() params: any) {
        return await this.secondaryOrderService.deleteCart(req, params);
    }

    @Post('/secondary-order-add')
    @ApiOperation({ summary: 'Secondary Order Add' })
    @ApiBody({ type: SecondaryOrderAddDto })
    async primaryOrderAdd(@Req() req: Request, @Body() params: SecondaryOrderAddDto) {
        return await this.secondaryOrderService.secondaryOrderAdd(req, params);
    }

    @Post('/secondary-order-list')
    @ApiOperation({ summary: 'Feth Primary Order List Data' })
    @ApiBody({ type: SecondaryOrderListDto })
    async primaryOrderList(@Req() req: Request, @Body() params: SecondaryOrderListDto) {
        return await this.secondaryOrderService.secondaryOrderList(req, params);
    }

    @Post('/secondary-order-detail')
    @ApiOperation({ summary: 'Primary Order Detail' })
    @ApiBody({ type: _IdDto })
    async primaryOrderDetail(@Req() req: Request, @Body() params: _IdDto) {
        return await this.secondaryOrderService.secondaryOrderDetail(req, params);
    }

    @Patch('secondary-order-status-change')
    @ApiOperation({ summary: 'Primary Order Status Change' })
    @ApiBody({ type: SecondaryOrderStatusChangeDto })
    async secondaryOrderStatusChange(@Req() req: Request, @Body() params: SecondaryOrderStatusChangeDto) {
        return await this.secondaryOrderService.secondaryOrderStatusChange(req, params);
    }

    @Patch('/delete-secondary-order-item')
    @ApiOperation({ summary: 'Delete Secondary Order Item' })
    @ApiBody({ type: DeleteSecondaryOrderItemDto })
    async deleteSecondaryOrderItem(@Req() req: Request, @Body() params: DeleteSecondaryOrderItemDto) {
        return await this.secondaryOrderService.deleteSecondaryOrderItem(req, params);
    }
}
