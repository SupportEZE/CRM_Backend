import { Body, Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { StockTransferService } from './stock-transfer.service';
import { ReadStockTransferDto, CreateCustomerToCustomerStockDto, ReadCustomerToCustomerDto, StatusDto, CreateCustomerToCompanyReturnDto, ReadCustomerToCompanyDto, StatusCustomerToCompanyDto, ReadDropdownDto } from './dto/stock-transfer.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('Stock-Transfer')
@ApiBearerAuth('Authorization')
@Controller('stock-transfer')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) { }
  @Post('/stock')
  @ApiOperation({ summary: 'Read Stock Transfer data' })
  @ApiBody({ type: ReadStockTransferDto })
  async read(@Req() req: any, @Body() params: ReadStockTransferDto): Promise<ReadStockTransferDto> {
    return await this.stockTransferService.CustomerStockRead(req, params);
  }

  @Post('/create')
  @ApiOperation({ summary: 'Create an Customer To Customer Stock', description: 'Allows users to create a audit request' })
  @ApiBody({ type: CreateCustomerToCustomerStockDto })
  async createCustomerToCustomer(@Req() req: any, @Body() params: CreateCustomerToCustomerStockDto): Promise<CreateCustomerToCustomerStockDto> {
    return await this.stockTransferService.CustomerToCustomerCreate(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read Stock Transfer data' })
  @ApiBody({ type: ReadCustomerToCustomerDto })
  async readCustomerToCustomer(@Req() req: any, @Body() params: ReadCustomerToCustomerDto): Promise<ReadCustomerToCustomerDto> {
    return await this.stockTransferService.CustomerToCustomerStockRead(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Detail Stock Transfer data' })
  @ApiBody({ type: _IdDto })
  async detail(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.stockTransferService.detail(req, params);
  }

  @Patch('/status')
  async status(@Req() req: any, @Body() params: StatusDto): Promise<StatusDto> {
    return await this.stockTransferService.status(req, params);
  }

  @Post('/company-return-create')
  @ApiOperation({ summary: 'Create an Customer To Customer Stock', description: 'Allows users to create a audit request' })
  @ApiBody({ type: CreateCustomerToCompanyReturnDto })
  async createCustomerToCompanyReturn(@Req() req: any, @Body() params: CreateCustomerToCompanyReturnDto): Promise<CreateCustomerToCompanyReturnDto> {
    return await this.stockTransferService.CustomerToCompanyReturnCreate(req, params);
  }

  @Post('/company-return-read')
  @ApiOperation({ summary: 'Read Stock Transfer data' })
  @ApiBody({ type: ReadCustomerToCompanyDto })
  async readCustomerToCompanyReturn(@Req() req: any, @Body() params: ReadCustomerToCompanyDto): Promise<ReadCustomerToCompanyDto> {
    return await this.stockTransferService.CustomerToCompanyReturnRead(req, params);
  }

  @Post('/company-return-detail')
  @ApiOperation({ summary: 'Detail Stock Transfer data' })
  @ApiBody({ type: _IdDto })
  async detailCustomerToCompanyReturn(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.stockTransferService.CustomerToCompanyReturnDetail(req, params);
  }

  @Patch('/company-return-status')
  async statusCompanyReturn(@Req() req: any, @Body() params: StatusCustomerToCompanyDto): Promise<StatusCustomerToCompanyDto> {
    return await this.stockTransferService.CompanyReturnStatus(req, params);
  }
  @Post('/read-dropdown')
  @ApiOperation({ summary: 'Read Stock Transfer data' })
  @ApiBody({ type: ReadDropdownDto })
  async readDropdown(@Req() req: any, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.stockTransferService.readDropdown(req, params);
  }
  @Post('/customer-return-create')
  @ApiOperation({ summary: 'Create an Customer To Customer Stock', description: 'Allows users to create a audit request' })
  @ApiBody({ type: CreateCustomerToCustomerStockDto })
  async createCustomerToCustomerReturn(@Req() req: any, @Body() params: CreateCustomerToCustomerStockDto): Promise<CreateCustomerToCustomerStockDto> {
    return await this.stockTransferService.CustomerToCustomerReturnCreate(req, params);
  }

  @Post('/customer-return-read')
  @ApiOperation({ summary: 'Read Stock Transfer data' })
  @ApiBody({ type: ReadCustomerToCustomerDto })
  async readCustomerToCustomerReturn(@Req() req: any, @Body() params: ReadCustomerToCustomerDto): Promise<ReadCustomerToCustomerDto> {
    return await this.stockTransferService.CustomerToCustomerStockReturnRead(req, params);
  }

  @Post('/customer-return-detail')
  @ApiOperation({ summary: 'Detail Stock Transfer data' })
  @ApiBody({ type: _IdDto })
  async detailCustomerToCustomerReturn(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.stockTransferService.CustomerToCustomerReturnDetail(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.stockTransferService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.stockTransferService.getDocumentByDocsId(req, params);
  }
}