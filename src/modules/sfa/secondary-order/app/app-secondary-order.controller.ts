import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { AppSecondaryOrderService } from './app-secondary-order.service';
import { SecondaryOrderService } from '../web/secondary-order.service';
import { CreateSecondaryCartDto, DeleteSecondaryOrderItemDto, ReadSecondarOrderProductDto, ReadSecondaryCartItemDto, SecondaryOrderAddDto, SecondaryOrderListDto } from '../web/dto/secondary-order.dto';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('App-Secondary-Order')
@ApiBearerAuth('Authorization')
@Controller('app-secondary-order')
export class AppSecondaryOrderController {
  constructor(
    private readonly appSecondaryOrderService: AppSecondaryOrderService,
    private readonly secondaryOrderService: SecondaryOrderService,
    private readonly sharedProductService: SharedProductService
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
  @ApiOperation({ summary: 'Read Shipping Detail' })
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
  @ApiOperation({ summary: 'Delet cart Item' })
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
  @ApiOperation({ summary: 'Delet cart Item' })
  @ApiBody({ type: SecondaryOrderAddDto })
  async primaryOrderAdd(@Req() req: Request, @Body() params: SecondaryOrderAddDto) {
    return await this.secondaryOrderService.secondaryOrderAdd(req, params);
  }

  @Post('/secondary-order-list')
  @ApiOperation({ summary: 'Feth Secondary Order List Data' })
  @ApiBody({ type: SecondaryOrderListDto })
  async primaryOrderList(@Req() req: Request, @Body() params: SecondaryOrderListDto) {
    return await this.secondaryOrderService.secondaryOrderList(req, params);
  }

  @Post('/secondary-order-detail')
  @ApiOperation({ summary: 'Secondary Order Detail' })
  @ApiBody({ type: _IdDto })
  async primaryOrderDetail(@Req() req: Request, @Body() params: _IdDto) {
    return await this.secondaryOrderService.secondaryOrderDetail(req, params);
  }

  @Patch('/delete-secondary-order-item')
  @ApiOperation({ summary: 'Delete Secondary Order' })
  @ApiBody({ type: DeleteSecondaryOrderItemDto })
  async deleteSecondaryOrderItem(@Req() req: Request, @Body() params: DeleteSecondaryOrderItemDto) {
    return await this.secondaryOrderService.deleteSecondaryOrderItem(req, params);
  }

  @Post('/secondary-order-by-customer-id')
  @ApiOperation({ summary: 'Secondary Order Detail' })
  @ApiBody({ type: SecondaryOrderListDto })
  async SecondaryOrderByCustomerId(@Req() req: Request, @Body() params: SecondaryOrderListDto) {
    return await this.secondaryOrderService.SecondaryOrderByCustomerId(req, params);
  }

}
