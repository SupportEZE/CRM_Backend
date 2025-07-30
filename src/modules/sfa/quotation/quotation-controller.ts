import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WEB_DTO_MAP } from './dto-map';
import { ClientDto } from 'src/decorators/client-dto.decorator';
import {
  Controller,
  Post,
  Req,
  UseInterceptors,
  UploadedFiles,
  Body,
  Patch,
} from '@nestjs/common';
import { ClientInterceptor } from 'src/interceptors/client.interceptor';
import { QuotationStrategyFactory } from './quotation-strategy.factory';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QuotationService } from './default/web/quotation.service';
import { DefaultEnquiryService } from '../enquiry/default/web/default-enquiry.service';
import { SitesService } from '../sites/web/sites.service';
import { DeleteQuotationDto, QuotationDetailDto, QuotationUpdateStatusDto } from './default/web/dto/quotation.dto';
@ApiTags('Web-Quotation')
@ApiBearerAuth('Authorization')
@Controller('quotation')
@UseInterceptors(ClientInterceptor)
export class NewQuotationController {
  constructor(
    private strategyFactory: QuotationStrategyFactory,
    private readonly quotationService: QuotationService,
    private readonly enquiryService: DefaultEnquiryService,
    private readonly sitesService: SitesService,
  ) { }

  @ApiOperation({
    summary: 'Create an Quotation',
    description: 'Allows users to create a new enquiry record.',
  })
  @Post('create')
  async create(@Req() req, @ClientDto(WEB_DTO_MAP.create) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.create(req, params);
  }

  @Post('read')
  async read(@Req() req, @ClientDto(WEB_DTO_MAP.read) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.read(req, params);
  }

  @Post('detail')
  async detail(@Req() req, @ClientDto(WEB_DTO_MAP.detail) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.detail(req, params);
  }

  @Post('detail-by-enquiry')
  async detail_by_enquiry(@Req() req, @ClientDto(WEB_DTO_MAP.quotationByEnquiry) params: any,) {
    const service = this.strategyFactory.getStrategy(req.client);
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

  @ApiOperation({ summary: 'Update Quotation Items' })
  @ApiBody({ type: QuotationUpdateStatusDto })
  @Patch('/update-item')
  async updateItems(@Req() req, @ClientDto(WEB_DTO_MAP.updateItems) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.addItem(req, params);
  }

  @ApiOperation({ summary: 'Update Status' })
  @ApiBody({ type: QuotationUpdateStatusDto })
  @Patch('/update-status')
  async updateStatus(@Req() req, @ClientDto(WEB_DTO_MAP.statusUpdate) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.updateStatus(req, params);
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

  @ApiOperation({ summary: 'Read Count' })
  @Post('/read-count')
  async readDashboardCount(
    @Req() req: Request,
    @Body() params: any,
  ): Promise<any> {
    return this.quotationService.readDashboardCount(req, params);
  }

  @ApiOperation({ summary: 'Read Count' })
  @Post('/read-dashboard-graph')
  async readDashboardGraph(
    @Req() req: Request,
    @Body() params: any,
  ): Promise<any> {
    return this.quotationService.readDashboardGraph(req, params);
  }

  @ApiOperation({ summary: 'Export Quotation Pdf' })
  @ApiBody({ type: QuotationDetailDto })
  @Post('/export-pdf')
  async exportPdf(
    @Req() req: Request,
    @Body() params: QuotationDetailDto,
  ): Promise<QuotationDetailDto> {
    return this.quotationService.exportPdf(req, params);
  }

  @ApiOperation({ summary: 'Read Sites Listing' })
  @Post('/read-site')
  async readSite(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.sitesService.readSite(req, params);
  }

  @ApiOperation({ summary: 'Read Enquiry Listing' })
  @Post('/read-enquiry')
  async readEnquiry(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.enquiryService.readEnquiry(req, params);
  }
}
