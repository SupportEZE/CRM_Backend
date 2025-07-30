import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';
import { AppCustomerService } from './default/app/app-customer.service';
import { CustomerService } from './default/web/customer.service';
import { SharedCustomerService } from './shared-customer.service';
import { DropdownService } from '../dropdown/web/dropdown.service';
import { ReadCustomerTypeDto } from '../customer-type/web/dto/customer-type.dto';
import { CreateCustomerDto, CustomerDetailDto, DuplicacyChecktDto, readDropdown, ReadInfluenceDropdownDto, UpdateDocDto } from './default/web/dto/customer.dto';
import { AppAssignCustomers, AppReadCustomerDto, AppSaveShippingAddressDto, CheckReferralCodeDto, CreateInfluencerDto, CustomerProfile, ReadDropdown, UpdateBankInfoDto, UpdateBasicInfoDto, UpdateDocumentInfoDto, UpdateProfileDto } from './default/app/dto/app-customer.dto';
import { readCustomerToCustomerMappingDto } from './default/web/dto/mapping.dto';
import { ClientInterceptor } from 'src/interceptors/client.interceptor';
import { ClientDto } from 'src/decorators/client-dto.decorator';
import { APP_DTO_MAP } from './customer-dto.map';
import { CustomerStrategyFactory } from './customer-strategy.factory';
@ApiTags('App Customer')
@ApiBearerAuth('Authorization')
@Controller('app-customer')
// @UseInterceptors(ClientInterceptor)
export class AppCustomerController {
  constructor(
    private readonly appCustomerService: AppCustomerService,
    private readonly customerService: CustomerService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly DropdownService: DropdownService,
    private readonly customerStrategyFactory: CustomerStrategyFactory
  ) { }

  @Public()
  @Post('/read-customer-type')
  @ApiOperation({ summary: 'Read Customer Type' })
  async readCustomerType(
    @Req() req: Request,
    @Body() params: ReadCustomerTypeDto,
  ): Promise<ReadCustomerTypeDto> {
    return await this.appCustomerService.readCustomerType(req, params);
  }
  @Post('/create')
  @ApiOperation({ summary: 'Create customer' })
  @ApiBody({ type: CreateCustomerDto })
  async create(@Req() req: Request, @Body() params: CreateCustomerDto) {
    return await this.customerService.create(req, params);
  }

  @ApiOperation({ summary: 'Read Customers', description: 'Allows users to create a new enquiry record.' })
  @Post('read')
  async read(@Req() req, @ClientDto(APP_DTO_MAP.read) params: any) {
    const service = this.customerStrategyFactory.getStrategy(req.client);
    return service.read(req, params);
  }

  @Public()
  @Post('/create-influencer')
  @ApiOperation({
    summary: 'Create Influencer',
    description: 'Create a new influencer profile.',
  })
  @ApiBody({ type: CreateInfluencerDto })
  async createInfluencer(
    @Req() req: Request,
    @Body() params: CreateInfluencerDto,
  ): Promise<CreateInfluencerDto> {
    return await this.appCustomerService.createInfluencer(req, params);
  }

  @Public()
  @Post('/duplicate')
  @ApiOperation({
    summary: 'Check Duplicate',
    description: 'Checks for duplicate customer records.',
  })
  @ApiBody({ type: DuplicacyChecktDto })
  async duplicate(
    @Req() req: any,
    @Body() params: DuplicacyChecktDto,
  ): Promise<DuplicacyChecktDto> {
    return await this.customerService.duplicate(req, params);
  }

  @Public()
  @Post('/check-referral')
  @ApiOperation({
    summary: 'Check Referral Code',
    description: 'Validates a referral code.',
  })
  @ApiBody({ type: CheckReferralCodeDto })
  async checkReferralCode(
    @Req() req: any,
    @Body() params: CheckReferralCodeDto,
  ): Promise<CheckReferralCodeDto> {
    return await this.appCustomerService.checkReferralCode(req, params);
  }

  @Post('/customer-profile')
  @ApiOperation({ summary: 'Profile Data' })
  async customerProfile(
    @Req() req: any,
    @Body() params: CustomerProfile,
  ): Promise<CustomerProfile> {
    return await this.appCustomerService.customerProfile(req, params);
  }

  @Patch('/update-profile')
  @ApiOperation({ summary: 'Update Profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @Req() req: any,
    @Body() params: UpdateProfileDto,
  ): Promise<UpdateProfileDto> {
    return await this.appCustomerService.updateProfile(req, params);
  }

  @Patch('/update-basic-info')
  @ApiOperation({ summary: 'Update basic Info' })
  @ApiBody({ type: UpdateBasicInfoDto })
  async updateBasicInfo(
    @Req() req: any,
    @Body() params: UpdateBasicInfoDto,
  ): Promise<UpdateBasicInfoDto> {
    return await this.appCustomerService.updateBasicInfo(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Get customer details' })
  @ApiBody({ type: CustomerDetailDto })
  async readDetail(@Req() req: Request, @Body() params: CustomerDetailDto) {
    return await this.customerService.detail(req, params);
  }

  @Patch('/update-bank-info')
  @ApiOperation({ summary: 'Update Bank Info' })
  @ApiBody({ type: UpdateBankInfoDto })
  async updateBankInfo(
    @Req() req: any,
    @Body() params: UpdateBankInfoDto,
  ): Promise<UpdateBankInfoDto> {
    return await this.appCustomerService.updateBankInfo(req, params);
  }

  @Patch('/update-docs-info')
  @ApiOperation({ summary: 'Update Docs Info' })
  @ApiBody({ type: UpdateDocumentInfoDto })
  async updateDocsInfo(
    @Req() req: any,
    @Body() params: UpdateDocumentInfoDto,
  ): Promise<UpdateDocumentInfoDto> {
    return await this.appCustomerService.updateDocsInfo(req, params);
  }

  @Post('/assign-customers')
  @ApiOperation({ summary: 'assign customer list' })
  @ApiBody({ type: AppAssignCustomers })
  async AppAssignCustomers(
    @Req() req: any,
    @Body() params: AppAssignCustomers,
  ): Promise<AppAssignCustomers> {
    return await this.appCustomerService.assignCustomers(req, params);
  }

  @Post('/customers-assignto-user')
  @ApiOperation({ summary: 'assign customer list' })
  @ApiBody({ type: ReadDropdown })
  async customersassignUser(
    @Req() req: any,
    @Body() params: ReadDropdown,
  ): Promise<ReadDropdown> {
    return await this.appCustomerService.customersAssignedtoUser(req, params);
  }

  @Post('/save-shipping-address')
  @ApiOperation({ summary: 'Save shipping address' })
  @ApiBody({ type: AppSaveShippingAddressDto })
  async saveShippingAddress(
    @Req() req: Request,
    @Body() params: AppSaveShippingAddressDto,
  ) {
    return await this.customerService.saveShippingAddress(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.customerService.saveDocs(files, req);
  }

  @Patch('/update-docs')
  @ApiOperation({ summary: 'update Docs' })
  @ApiBody({ type: UpdateDocDto })
  async updateDocs(
    @Req() req: Request,
    @Body() params: UpdateDocDto,
  ): Promise<UpdateDocDto> {
    return await this.customerService.updateDocs(req, params);
  }

  @Post('/get-doc')
  async getDocumentById(
    @Req() req: Request,
    @Body() params: _IdDto,
  ): Promise<_IdDto> {
    return await this.sharedCustomerService.getDocumentByDocsId(req, params);
  }
  @Post('/read-dropdown')
  async readDropdown(
    @Req() req: Request,
    @Body() params: readDropdown,
  ): Promise<readDropdown> {
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
}
