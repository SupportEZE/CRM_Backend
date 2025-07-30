import {
  Controller,
  Post,
  Req,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { _IdDto } from 'src/common/dto/common.dto';
import { WEB_DTO_MAP } from './dto-map';
import { ClientDto } from 'src/decorators/client-dto.decorator';
import { QuotationStrategyFactory } from './quotation-strategy.factory';
import { ClientInterceptor } from 'src/interceptors/client.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  CreateQuotationDto,
  DeleteQuotationDto,
  QuotationUpdateStatusDto,
  UpdateQuotationItemDto,
} from './default/web/dto/quotation.dto';
import {
  AppReadQuotationDto,
  QuotationUpdateStageDto,
} from './default/app/dto/app-quotation.dto';
import { QuotationService } from './default/web/quotation.service';
import { SitesService } from '../sites/web/sites.service';
import { DefaultEnquiryService } from '../enquiry/default/web/default-enquiry.service';
import { AppQuotationService } from './default/app/app-quotation.service';

@ApiTags('Quotation')
@ApiBearerAuth('Authorization')
@Controller('new-app-quotation')
@UseInterceptors(ClientInterceptor)
export class AppNewQuotationController {
  constructor(
    private strategyFactory: QuotationStrategyFactory,
    private readonly appQuotationService: AppQuotationService,
    private readonly quotationService: QuotationService,
    private readonly enquiryService: DefaultEnquiryService,
    private readonly sitesService: SitesService,
  ) {}

  @Post('create')
  async create(@Req() req, @ClientDto(WEB_DTO_MAP.create) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.create(req, params);
  }

  @Post('read')
  async read(@Req() req, @ClientDto(WEB_DTO_MAP.read) params: any) {
    const service = this.strategyFactory.getAppStrategy(req.client);
    return service.read(req, params);
  }
  @Post('detail')
  async detail(@Req() req, @ClientDto(WEB_DTO_MAP.detail) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    console.log('this is service', req.client);
    return service.detail(req, params);
  }
  @Post('detail-by-enquiry')
  async detail_by_enquiry(
    @Req() req,
    @ClientDto(WEB_DTO_MAP.quotationByEnquiry) params: any,
  ) {
    const service = this.strategyFactory.getStrategy(req.client);
    console.log('this is service', req.client);
    return service.detail_by_enquiry(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.upload(files, req);
  }
  @ApiOperation({ summary: 'Get Docs' })
  @Post('get-doc')
  async getDocument(@Req() req, @ClientDto(WEB_DTO_MAP.getDocs) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.getDocument(req, params);
  }

  @ApiOperation({ summary: 'Delete Quotation' })
  @ApiBody({ type: DeleteQuotationDto })
  @Patch('/delete')
  async delete(
    @Req() req: Request,
    @Body() params: DeleteQuotationDto,
  ): Promise<DeleteQuotationDto> {
    return this.quotationService.delete(req, params);
  }

  @ApiOperation({ summary: 'Update Stage' })
  @Patch('/update-stage')
  @ApiBody({ type: QuotationUpdateStageDto })
  async updateStatus(
    @Req() req: Request,
    @Body() params: any,
  ): Promise<QuotationUpdateStageDto> {
    return this.appQuotationService.updateStage(req, params);
  }

  @ApiOperation({ summary: 'Update Status' })
  @Patch('/update-status')
  @ApiBody({ type: QuotationUpdateStatusDto })
  async updateQuoteStatus(
    @Req() req,
    @ClientDto(WEB_DTO_MAP.statusUpdate) params: any,
  ) {
    const service = this.strategyFactory.getAppStrategy(req.client);
    return service.updateStatus(req, params);
  }

  @ApiOperation({ summary: 'Add Quotation Items' })
  @ApiBody({ type: UpdateQuotationItemDto })
  @Patch('/update-item')
  async addItem(
    @Req() req: Request,
    @Body() params: UpdateQuotationItemDto,
  ): Promise<UpdateQuotationItemDto> {
    return this.quotationService.addItem(req, params);
  }

  @ApiOperation({ summary: 'Read Counts' })
  @Post('/read-insights')
  async readDashboardCount(
    @Req() req: Request,
    @Body() params: any,
  ): Promise<any> {
    return this.quotationService.readDashboardCount(req, params);
  }

  @ApiOperation({ summary: 'Read Counts' })
  @Post('/read-matrix')
  async customerWiseQuotation(
    @Req() req: Request,
    @Body() params: any,
  ): Promise<any> {
    return this.appQuotationService.customerWiseQuotation(req, params);
  }

  @ApiOperation({ summary: 'Read Monthly Graph' })
  @Post('/read-monthly-graph')
  async readDashboardGraph(
    @Req() req: Request,
    @Body() params: any,
  ): Promise<any> {
    return this.quotationService.readDashboardGraph(req, params);
  }

  @ApiOperation({ summary: 'Read Enquiry Listing' })
  @Post('/read-enquiry')
  async readEnquiry(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.enquiryService.readEnquiry(req, params);
  }

  @ApiOperation({ summary: 'Read Sites Listing' })
  @Post('/read-site')
  async readSite(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.sitesService.readSite(req, params);
  }
}
