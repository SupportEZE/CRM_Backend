import { Body, Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateCartDto, CreateOrderSchemeDto, DeleteCustomerCart, DeletePrimaryOrderItemDto, DetailOrderSchmeDto, PrimaryOrderAddDto, PrimaryOrderListDto, PrimaryOrderStatusChangeDto, ReadCartItemDto, ReadOrderSchemeDto, ReadProductDto, ReadShippingDto, SchemeStatusUpdateDto } from './dto/order.dto';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('Order')
@ApiBearerAuth('Authorization')
@Controller('order')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly sharedCustomerService: SharedCustomerService,
        private readonly sharedProductService: SharedProductService,
    ) { }

    @Post('/fetch-shipping-address')
    @ApiOperation({ summary: 'Read Shipping Detail' })
    @ApiBody({ type: ReadShippingDto })
    async getShippingInfo(@Req() req: Request, @Body() params: ReadShippingDto) {
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

    @Post('/product-detail')
    @ApiOperation({ summary: 'Get Product Detail' })
    @ApiBody({ type: ReadCartItemDto })
    async getProductDetail(@Req() req: Request, @Body() params: any) {
        return await this.orderService.getProductDetail(req, params);
    }

    @Patch('/delete-cart-item')
    @ApiOperation({ summary: 'Delet cart Item' })
    @ApiBody({ type: _IdDto })
    async deleteCartItem(@Req() req: Request, @Body() params: _IdDto) {
        return await this.orderService.deleteCartItem(req, params);
    }

    @Patch('/delete-cart')
    @ApiOperation({ summary: 'Delete COmplete Cart' })
    @ApiBody({ type: DeleteCustomerCart })
    async deleteCart(@Req() req: Request, @Body() params: DeleteCustomerCart) {
        return await this.orderService.deleteCart(req, params);
    }

    @Post('/primary-order-add')
    @ApiOperation({ summary: 'Delet cart Item' })
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

    @Patch('primary-order-status-change')
    @ApiOperation({ summary: 'Primary Order Status Change' })
    @ApiBody({ type: PrimaryOrderStatusChangeDto })
    async primaryOrderStatusChange(@Req() req: Request, @Body() params: PrimaryOrderStatusChangeDto) {
        return await this.orderService.primaryOrderStatusChange(req, params);
    }

    @Post('/export-primary-order-pdf')
    @ApiOperation({ summary: 'Export Primary Order Pdf' })
    @ApiBody({ type: _IdDto })
    async exportPrimaryOrderPdf(@Req() req: Request, @Body() params: _IdDto) {
        return await this.orderService.exportPrimaryOrderPdf(req, params);
    }

    @Post('/create-scheme')
    @ApiOperation({ summary: 'Create Order Scheme' })
    @ApiBody({ type: CreateOrderSchemeDto })
    async createScheme(@Req() req: Request, @Body() params: CreateOrderSchemeDto) {
        return await this.orderService.createScheme(req, params);
    }

    @Post('/read-scheme')
    @ApiOperation({ summary: 'Read Product' })
    @ApiBody({ type: ReadOrderSchemeDto })
    async readScheme(@Req() req: Request, @Body() params: ReadOrderSchemeDto): Promise<ReadOrderSchemeDto> {
        return this.orderService.readScheme(req, params);
    }

    @Patch('/delete-scheme')
    @ApiOperation({ summary: 'Delete Scheme' })
    @ApiBody({ type: _IdDto })
    async deleteScheme(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
        return this.orderService.deleteScheme(req, params);
    }

    @Post('/scheme-detail')
    @ApiOperation({ summary: 'Scheme Detail' })
    @ApiBody({ type: DetailOrderSchmeDto })
    async schemeDetail(@Req() req: Request, @Body() params: DetailOrderSchmeDto): Promise<DetailOrderSchmeDto> {
        return this.orderService.schemeDetail(req, params);
    }

    @Patch('/update-scheme-status')
    @ApiOperation({ summary: 'Scheme Detail' })
    @ApiBody({ type: SchemeStatusUpdateDto })
    async updateSchemeStatus(@Req() req: Request, @Body() params: SchemeStatusUpdateDto): Promise<SchemeStatusUpdateDto> {
        return this.orderService.updateSchemeStatus(req, params);
    }

    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        return await this.orderService.upload(files, req);
    }

    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
        return await this.orderService.getDocumentByDocsId(req, params);
    }

    @Patch('/delete-file')
    async deleteFile(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
        return await this.orderService.deleteFile(req, params);
    }
}
