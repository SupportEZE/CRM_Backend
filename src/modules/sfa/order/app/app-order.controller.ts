import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AppOrderService } from './app-order.service';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { readCustomer, ReadOrderSchemeDto } from './dto/app-order.dto';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { OrderService } from '../web/order.service';
import { CreateCartDto, DeletePrimaryOrderItemDto, PrimaryOrderAddDto, PrimaryOrderListDto, ReadCartItemDto, ReadProductDto } from '../web/dto/order.dto';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('App-Order')
@ApiBearerAuth('Authorization')
@Controller('app-order')
export class AppOrderController {
  constructor(
    private readonly appOrderService: AppOrderService,
    private readonly orderService: OrderService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedProductService: SharedProductService
  ) { }

  @Post('/customer-type')
  async customerType(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.customerTypeService.readDropdown(req, params);
  }

  @Post('/customer')
  async customer(@Req() req: Request, @Body() params: readCustomer): Promise<readCustomer> {
    return await this.sharedCustomerService.readDropdown(req, params);
  }

  @Post('/read-scheme')
  @ApiOperation({ summary: 'Read Scheme' })
  @ApiBody({ type: ReadOrderSchemeDto })
  async readScheme(@Req() req: Request, @Body() params: ReadOrderSchemeDto): Promise<ReadOrderSchemeDto> {
    return this.appOrderService.readScheme(req, params);
  }

  @Post('/scheme-detail')
  @ApiOperation({ summary: 'Read Scheme' })
  @ApiBody({ type: _IdDto })
  async schemeDetail(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return this.appOrderService.schemeDetail(req, params);
  }

  @Post('/fetch-shipping-address')
  @ApiOperation({ summary: 'Read Shipping Detail' })
  async getShippingInfo(@Req() req: Request, @Body() params: any) {
    return await this.sharedCustomerService.getShippingInfo(req, params);
  }

  @Post('/fetch-order-dropdowns')
  @ApiOperation({ summary: 'Read Dropdows' })
  async fetchOrderDropdowns(@Req() req: Request, @Body() params: any) {
    return await this.orderService.fetchOrderDropdowns(req, params);
  }

  @Post('/read-product')
  @ApiOperation({ summary: 'Read Product' })
  @ApiBody({ type: ReadProductDto })
  async readProduct(@Req() req: Request, @Body() params: ReadProductDto): Promise<ReadProductDto> {
    return this.sharedProductService.readProduct(req, params);
  }

  @Post('/add-cart')
  @ApiOperation({ summary: 'Read Shipping Detail' })
  @ApiBody({ type: CreateCartDto })
  async itemAddedInCart(@Req() req: Request, @Body() params: CreateCartDto) {
    return await this.orderService.itemAddedInCart(req, params);
  }

  @Post('/read-cart')
  @ApiOperation({ summary: 'Read Shipping Detail' })
  @ApiBody({ type: ReadCartItemDto })
  async readCartItemList(@Req() req: Request, @Body() params: ReadCartItemDto) {
    return await this.orderService.readCartItemList(req, params);
  }

  @Patch('/delete-cart-item')
  @ApiOperation({ summary: 'Delet cart Item' })
  @ApiBody({ type: _IdDto })
  async deleteCartItem(@Req() req: Request, @Body() params: _IdDto) {
    return await this.orderService.deleteCartItem(req, params);
  }

  @Patch('/delete-cart')
  @ApiOperation({ summary: 'Delete Customer Cart' })
  async deleteCart(@Req() req: Request, @Body() params: any) {
    return await this.orderService.deleteCart(req, params);
  }

  @Post('/primary-order-add')
  @ApiOperation({ summary: 'Primary Order Add' })
  @ApiBody({ type: PrimaryOrderAddDto })
  async primaryOrderAdd(@Req() req: Request, @Body() params: PrimaryOrderAddDto) {
    return await this.orderService.primaryOrderAdd(req, params);
  }

  @Post('/primary-order-list')
  @ApiOperation({ summary: 'Feth Primary Order List Data' })
  @ApiBody({ type: PrimaryOrderListDto })
  async primaryOrderList(@Req() req: Request, @Body() params: PrimaryOrderListDto) {
    return await this.orderService.primaryOrderList(req, params);
  }

  @Post('/primary-order-detail')
  @ApiOperation({ summary: 'Primary Order Detail' })
  @ApiBody({ type: _IdDto })
  async primaryOrderDetail(@Req() req: Request, @Body() params: _IdDto) {
    return await this.orderService.primaryOrderDetail(req, params);
  }

  @Patch('/delete-primary-order-item')
  @ApiOperation({ summary: 'Primary Order Detail' })
  @ApiBody({ type: DeletePrimaryOrderItemDto })
  async deletePrimaryOrderItem(@Req() req: Request, @Body() params: DeletePrimaryOrderItemDto) {
    return await this.orderService.deletePrimaryOrderItem(req, params);
  }
}
