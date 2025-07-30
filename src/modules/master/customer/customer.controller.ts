import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  Request,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CustomerService } from './default/web/customer.service';

import {
  BankInfoDto,
  CreateCustomerDto,
  CustomerDetailDto,
  DeleteCustomerDto,
  DuplicacyChecktDto,
  SaveOtherInfoDto,
  UpdateCustomerDto,
  UpdateDocDto,
  readDropdown,
  saveKycStatusDto,
  UpdateCustomerStatusDto,
  CustomerSaveDiscountDto,
  CustomerReadDiscountDto,
  DeleteCustomerFIleDto,
  CreateMarkaDto,
  UpdateMarkaDto,
  DeleteMarkaDto,
  UploadCustomerDto,
  UpdateCustomerStageDto,
  ReadCustomerByMobileDto,
  ReadCustomerProfileStatusDto,
} from './default/web/dto/customer.dto';
import {
  AssignCustomerMapping,
  AssignedStateDto,
  SaveUserToCustomerMappingDto,
  readCustomerToCustomerMappingDto,
} from './default/web/dto/mapping.dto';
import {
  CreateContactPersonDto,
  DeleteContactPersonInfo,
  UpdateContactPersonDto,
} from './default/web/dto/contact-person.dto';
import {
  DeleteShippingAddress,
  SaveShippingAddressDto,
  UpdateShippingAddressDto,
} from './default/web/dto/shipping-address.dto';
import { SharedCustomerService } from './shared-customer.service';
import { SharedProductService } from '../product/shared-product-service';
import { DashboardService } from './dashboard.service';
import { _IdDto } from 'src/common/dto/common.dto';
import { CustomerUploadService } from './customer-upload.service';
import { CustomerStrategyFactory } from './customer-strategy.factory';
import { ClientDto } from 'src/decorators/client-dto.decorator';
import { WEB_DTO_MAP } from './customer-dto.map';
import { ClientInterceptor } from "src/interceptors/client.interceptor";
import { CommentService } from 'src/modules/sfa/comment/web/comment.service';
import { ReadCommentsDto, SaveCommentDto } from 'src/modules/sfa/comment/web/dto/comment.dto';

@ApiTags('Customer')
@ApiBearerAuth()
@Controller('customer')
@UseInterceptors(ClientInterceptor)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedProductService: SharedProductService,
    private readonly dashboardService: DashboardService,
    private readonly customerUploadService: CustomerUploadService,
    private readonly customerStrategyFactory: CustomerStrategyFactory,
    private readonly commentService: CommentService,
  ) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create customer' })
  @ApiBody({ type: CreateCustomerDto })
  async create(@Req() req: Request, @Body() params: CreateCustomerDto) {
    return await this.customerService.create(req, params);
  }

  @Patch('/update')
  @ApiOperation({ summary: 'Update customer' })
  @ApiBody({ type: UpdateCustomerDto })
  async update(@Req() req: Request, @Body() params: UpdateCustomerDto) {
    return await this.customerService.update(req, params);
  }

  @Patch('/update-profile-status')
  @ApiOperation({ summary: 'Update customer profile status' })
  async updateCustomerProfileStatus(@Req() req, @ClientDto(WEB_DTO_MAP.updateCustomerProfileStatus) params: any) {
    const service = this.customerStrategyFactory.getStrategy(req.client);
    return service.update(req, params);
  }


  @Patch('/update-status')
  @ApiOperation({ summary: 'Update customer status' })
  @ApiBody({ type: UpdateCustomerStatusDto })
  async updateStatus(
    @Req() req: Request,
    @Body() params: UpdateCustomerStatusDto,
  ) {
    return await this.customerService.update(req, params);
  }

  @Patch('/delete')
  @ApiOperation({ summary: 'Delete customer' })
  @ApiBody({ type: DeleteCustomerDto })
  async delete(@Req() req: Request, @Body() params: DeleteCustomerDto) {
    return await this.customerService.update(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read customers' })
  async read(@Req() req, @ClientDto(WEB_DTO_MAP.read) params: any) {
    const service = this.customerStrategyFactory.getStrategy(req.client);
    return service.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Get customer details' })
  @ApiBody({ type: CustomerDetailDto })
  async readDetail(@Req() req: Request, @Body() params: CustomerDetailDto) {
    return await this.customerService.detail(req, params);
  }

  @Post('/duplicate')
  @ApiOperation({ summary: 'Check for duplicate customer' })
  @ApiBody({ type: DuplicacyChecktDto })
  async duplicate(@Req() req: Request, @Body() params: DuplicacyChecktDto) {
    return await this.customerService.duplicate(req, params);
  }

  @Post('/save-user-to-customer-mapping')
  @ApiOperation({ summary: 'Map user to customer' })
  @ApiBody({ type: SaveUserToCustomerMappingDto })
  async saveUserToCustomerMapping(
    @Req() req: Request,
    @Body() params: SaveUserToCustomerMappingDto,
  ) {
    return await this.customerService.saveUserToCustomerMapping(req, params);
  }

  @Post('/assign-customer-mapping')
  @ApiOperation({ summary: 'Map customer to customer' })
  @ApiBody({ type: AssignCustomerMapping })
  async assignCustomerMapping(
    @Req() req: Request,
    @Body() params: AssignCustomerMapping,
  ) {
    return await this.customerService.assignCustomerMapping(req, params);
  }

  @Post('/save-bank-info')
  @ApiOperation({ summary: 'Save bank information' })
  @ApiBody({ type: BankInfoDto })
  async saveBankInfo(@Req() req: Request, @Body() params: BankInfoDto) {
    return await this.customerService.saveBankInfo(req, params);
  }

  @Post('/save-contact-person-info')
  @ApiOperation({ summary: 'Save contact person info' })
  @ApiBody({ type: CreateContactPersonDto })
  async saveContactPersonInfo(
    @Req() req: Request,
    @Body() params: CreateContactPersonDto,
  ) {
    return await this.customerService.saveContactPersonInfo(req, params);
  }

  @Patch('/update-contact-person-info')
  @ApiOperation({ summary: 'Update contact person info' })
  @ApiBody({ type: UpdateContactPersonDto })
  async updateContactPersonInfo(
    @Req() req: Request,
    @Body() params: UpdateContactPersonDto,
  ) {
    return await this.customerService.updateContactPersonInfo(req, params);
  }

  @Patch('/delete-contact-person-info')
  @ApiOperation({ summary: 'Delete contact person info' })
  @ApiBody({ type: DeleteContactPersonInfo })
  async deleteContactPersonInfo(
    @Req() req: Request,
    @Body() params: DeleteContactPersonInfo,
  ) {
    return await this.customerService.updateContactPersonInfo(req, params);
  }

  @Post('/save-marka')
  @ApiOperation({ summary: 'Save marka' })
  @ApiBody({ type: CreateMarkaDto })
  async saveMarka(@Req() req: Request, @Body() params: CreateMarkaDto) {
    return await this.customerService.saveMarka(req, params);
  }

  @Patch('/update-marka')
  @ApiOperation({ summary: 'Update marka' })
  @ApiBody({ type: UpdateMarkaDto })
  async updateMarka(@Req() req: Request, @Body() params: UpdateMarkaDto) {
    return await this.customerService.updateMarka(req, params);
  }

  @Patch('/delete-marka')
  @ApiOperation({ summary: 'Delete marka' })
  @ApiBody({ type: DeleteMarkaDto })
  async deleteMarka(@Req() req: Request, @Body() params: DeleteMarkaDto) {
    return await this.customerService.updateMarka(req, params);
  }

  @Patch('/save-other-info')
  @ApiOperation({ summary: 'Save other customer information' })
  @ApiBody({ type: SaveOtherInfoDto })
  async saveOtherInfo(@Req() req: Request, @Body() params: SaveOtherInfoDto) {
    return await this.customerService.saveOtherInfo(req, params);
  }

  @Post('/save-shipping-address')
  @ApiOperation({ summary: 'Save shipping address' })
  @ApiBody({ type: SaveShippingAddressDto })
  async saveShippingAddress(
    @Req() req: Request,
    @Body() params: SaveShippingAddressDto,
  ) {
    return await this.customerService.saveShippingAddress(req, params);
  }

  @Patch('/update-shipping-address')
  @ApiOperation({ summary: 'Update shipping address' })
  @ApiBody({ type: UpdateShippingAddressDto })
  async updateShippingAddress(
    @Req() req: Request,
    @Body() params: UpdateShippingAddressDto,
  ) {
    return await this.customerService.updateShippingAddress(req, params);
  }

  @Patch('/delete-shipping-address')
  @ApiOperation({ summary: 'Delete shipping address' })
  @ApiBody({ type: DeleteShippingAddress })
  async deleteShippingAddress(
    @Req() req: Request,
    @Body() params: DeleteShippingAddress,
  ) {
    return await this.customerService.updateShippingAddress(req, params);
  }

  @Post('/read-dropdown')
  @ApiOperation({ summary: 'Read dropdown values' })
  @ApiBody({ type: readDropdown })
  async readDropdown(@Req() req: Request, @Body() params: readDropdown) {
    return await this.sharedCustomerService.readDropdown(req, params);
  }

  @Post('/read-customer-to-customer-mapping')
  @ApiOperation({ summary: 'Read customer-to-customer mapping' })
  @ApiBody({ type: readCustomerToCustomerMappingDto })
  async readCustomerToCustomerMapping(
    @Req() req: Request,
    @Body() params: readCustomerToCustomerMappingDto,
  ) {
    return await this.customerService.getCustomerAssigning(req, params);
  }

  @Patch('/save-kyc-status')
  @ApiOperation({ summary: 'Save KYC status' })
  @ApiBody({ type: saveKycStatusDto })
  async saveKycStatus(@Req() req: Request, @Body() params: saveKycStatusDto) {
    return await this.customerService.saveKycStatus(req, params);
  }

  @Patch('/update-docs')
  @ApiOperation({ summary: 'Update documents' })
  @ApiBody({ type: UpdateDocDto })
  async updateDocs(@Req() req: Request, @Body() params: UpdateDocDto) {
    return await this.customerService.updateDocs(req, params);
  }

  @Post('/upload')
  @ApiOperation({ summary: 'Upload multiple files' })
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.customerService.saveDocs(files, req);
  }

  @Post('/get-doc')
  @ApiOperation({ summary: 'Get documents by ID' })
  @ApiBody({ type: _IdDto })
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto) {
    return await this.sharedCustomerService.getDocumentByDocsId(req, params);
  }

  @Post('/save-discount')
  @ApiOperation({ summary: 'Save product discount' })
  @ApiBody({ type: CustomerSaveDiscountDto })
  async saveDiscount(
    @Req() req: Request,
    @Body() params: CustomerSaveDiscountDto,
  ) {
    return await this.sharedProductService.saveDiscount(req, params);
  }

  @Post('/category-discount')
  @ApiOperation({ summary: 'Get category discount' })
  @ApiBody({ type: CustomerReadDiscountDto })
  async categoryDiscount(
    @Req() req: Request,
    @Body() params: CustomerReadDiscountDto,
  ) {
    return await this.sharedProductService.categoryDiscount(req, params);
  }

  @Post('/product-discount')
  @ApiOperation({ summary: 'Get product discount' })
  @ApiBody({ type: CustomerReadDiscountDto })
  async productDiscount(
    @Req() req: Request,
    @Body() params: CustomerReadDiscountDto,
  ) {
    return await this.sharedProductService.productDiscount(req, params);
  }

  @Post('/influencer-dashboard')
  @ApiOperation({ summary: 'get dashboard data of influencers detail page' })
  async influencerDashboard(@Req() req: Request, @Body() params: any) {
    return await this.dashboardService.influencerDashboard(req, params);
  }

  @Post('/influencer-statistics')
  @ApiOperation({ summary: 'get dashboard data of influencers detail page' })
  async influencerDashboardStatistics(
    @Req() req: Request,
    @Body() params: any,
  ) {
    return await this.dashboardService.influencerDashboardStatistics(
      req,
      params,
    );
  }

  @Patch('/delete-file')
  @ApiOperation({ summary: 'Delete product image file' })
  @ApiBody({ type: DeleteCustomerFIleDto })
  async deleteFile(
    @Req() req: Request,
    @Body() params: DeleteCustomerFIleDto,
  ): Promise<DeleteCustomerFIleDto> {
    return await this.sharedCustomerService.deleteFile(req, params);
  }

  @Post('upload-csv')
  @ApiBody({ type: UploadCustomerDto })
  @UseInterceptors(FileInterceptor('file'))
  async importProductData(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.customerUploadService.uploadCustomerData(req, file);
  }

  @Post('/assign-states-districts')
  @ApiOperation({ summary: 'Assigned state district to Customer' })
  @ApiBody({ type: AssignedStateDto })
  async assignedStatesDistrict(
    @Req() req: Request,
    @Body() params: AssignedStateDto,
  ) {
    return await this.sharedCustomerService.assignedStateToCustomer(
      req,
      params,
    );
  }

  @Post('/read-customer-by-mobile')
  @ApiOperation({ summary: 'Assigned state district to Customer' })
  @ApiBody({ type: ReadCustomerByMobileDto })
  async ReadCustomersByMobile(@Req() req: any, @Body() params: ReadCustomerByMobileDto,) {
    return await this.sharedCustomerService.ReadCustomersByMobile(req, params);
  }

  @Post('/customer-stage-update')
  @ApiOperation({ summary: 'Read customers' })
  @ApiBody({ type: UpdateCustomerStageDto })
  async updateCustomerStages(@Req() req, @ClientDto(WEB_DTO_MAP.updateCustomerStages) params: any) {
    const service = this.customerStrategyFactory.getStrategy(req.client);
    return service.updateCustomerStage(req, params);
  }

  @Post('/read-customer-status')
  @ApiOperation({ summary: 'Read Customer Status' })
  @ApiBody({ type: ReadCustomerProfileStatusDto })
  async readCustomerProfileStatus(@Req() req: any, @Body() params: ReadCustomerProfileStatusDto) {
    return await this.sharedCustomerService.readCustomerProfileStatus(req, params);
  }

  @ApiOperation({ summary: 'Save Comment' })
  @ApiBody({ type: SaveCommentDto })
  @Post('/save-comment')
  async saveComment(@Req() req: Request, @Body() params: SaveCommentDto): Promise<SaveCommentDto> {
    return this.commentService.saveComment(req, params);
  }

  @ApiOperation({ summary: 'Read Comment' })
  @ApiBody({ type: ReadCommentsDto })
  @Post('/read-comment')
  async readComments(@Req() req: Request, @Body() params: ReadCommentsDto): Promise<SaveCommentDto> {
    return this.commentService.readComments(req, params);
  }
}
