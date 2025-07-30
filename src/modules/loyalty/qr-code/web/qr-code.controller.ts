import { Body, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { QrcodeService } from './qr-code.service';
import { CreateQRCodeDto, ItemDto, ReadQrDto, ReadQrHistoryDto, DetailQrHistoryDto, ReadScanQrDto, PrintQrDto, DeleteQrHistoryDto, DeleteMasterBoxDto, DeleteQrDto, ReadMasterQrDropdownDto, ReadMasterQrDto, CreateMasterBoxDto, QrReopenQrDto, StatusChangeDto, QrDropDownDto, MasterBoxScanDto } from './dto/qr-code.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
@ApiTags('qr-code')
@ApiBearerAuth('Authorization')
@Controller('qr-code')
export class CouponController {
  constructor(
    private readonly qrcodeService: QrcodeService,
  ) { }
  @ApiOperation({ summary: 'Fetch product.' })
  @ApiBody({ type: ItemDto })
  @Post('/product-data')
  async readItem(@Req() req: any, @Body() params: ItemDto): Promise<ItemDto> {
    return await this.qrcodeService.readItem(req, params);
  }

  @ApiOperation({ summary: 'Create Qr.' })
  @ApiBody({ type: CreateQRCodeDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateQRCodeDto): Promise<CreateQRCodeDto> {
    return await this.qrcodeService.create(req, params);
  }
  @ApiOperation({ summary: 'Read History.' })
  @ApiBody({ type: ReadQrHistoryDto })
  @Post('/read-history')
  async readHistory(@Req() req: any, @Body() params: ReadQrHistoryDto): Promise<ReadQrHistoryDto> {
    return await this.qrcodeService.readHistory(req, params);
  }

  @ApiOperation({ summary: 'Read History.' })
  @ApiBody({ type: DetailQrHistoryDto })
  @Post('/detail-history')
  async detailHistory(@Req() req: any, @Body() params: DetailQrHistoryDto): Promise<DetailQrHistoryDto> {
    return await this.qrcodeService.detailHistory(req, params);
  }

  @ApiOperation({ summary: 'Delete History.' })
  @ApiBody({ type: DeleteQrHistoryDto })
  @Patch('/delete-history')
  async deleteHistory(@Req() req: any, @Body() params: DeleteQrHistoryDto): Promise<DeleteQrHistoryDto> {
    return await this.qrcodeService.deleteHistory(req, params);
  }

  @ApiOperation({ summary: 'Delete Qr.' })
  @ApiBody({ type: DeleteQrDto })
  @Patch('/delete-qr')
  async deleteQr(@Req() req: any, @Body() params: DeleteQrDto): Promise<DeleteQrDto> {
    return await this.qrcodeService.deleteQr(req, params);
  }

  @ApiOperation({ summary: 'Delete Master Box.' })
  @ApiBody({ type: DeleteMasterBoxDto })
  @Patch('/delete-master-box')
  async deleteMasterBox(@Req() req: any, @Body() params: DeleteMasterBoxDto): Promise<DeleteMasterBoxDto> {
    return await this.qrcodeService.deleteMasterBox(req, params);
  }

  @ApiOperation({ summary: 'QR List.' })
  @ApiBody({ type: ReadQrDto })
  @Post('/read-qr')
  async readQr(@Req() req: any, @Body() params: ReadQrDto): Promise<ReadQrDto> {
    return await this.qrcodeService.readQr(req, params);
  }

  @ApiOperation({ summary: 'Scanned Qr List.' })
  @Post('/read-scanqr')
  async readScanQr(@Req() req: any, @Body() params: ReadScanQrDto): Promise<ReadScanQrDto> {
    return await this.qrcodeService.readScanQr(req, params);
  }

  @ApiOperation({ summary: 'Print staus change.' })
  @Patch('/print-status-change')
  async printStatusChange(@Req() req: any, @Body() params: PrintQrDto): Promise<PrintQrDto> {
    return await this.qrcodeService.printStatusChange(req, params);
  }

  @ApiOperation({ summary: 'staus change.' })
  @Patch('/update-status')
  async StatusChange(@Req() req: any, @Body() params: StatusChangeDto): Promise<StatusChangeDto> {
    return await this.qrcodeService.statusChange(req, params);
  }

  @ApiOperation({ summary: 'Reopen Qr Code.' })
  @Post('/qr-reopen')
  async reopenQr(@Req() req: any, @Body() params: QrReopenQrDto): Promise<QrReopenQrDto> {
    return await this.qrcodeService.reopenQr(req, params);
  }

  @ApiOperation({ summary: 'Qr dropdown.' })
  @Post('/qr-dropdown')
  async readDropDown(@Req() req: any, @Body() params: QrDropDownDto): Promise<QrDropDownDto> {
    return await this.qrcodeService.readDropDown(req, params);
  }

  @ApiOperation({ summary: 'Master Box Create.' })
  @ApiBody({ type: CreateMasterBoxDto })
  @Post('/create-master-box')
  async createMasterBox(@Req() req: any, @Body() params: CreateMasterBoxDto): Promise<CreateMasterBoxDto> {
    return await this.qrcodeService.createMasterBox(req, params);
  }

  @ApiOperation({ summary: 'Master Box Create.' })
  @ApiBody({ type: ReadMasterQrDto })
  @Post('/read-master-box')
  async readMasterBox(@Req() req: any, @Body() params: ReadMasterQrDto): Promise<ReadMasterQrDto> {
    return await this.qrcodeService.readMasterBox(req, params);
  }

  @ApiOperation({ summary: 'Master Box Create.' })
  @ApiBody({ type: ReadMasterQrDropdownDto })
  @Post('/read-master-box-dropdown')
  async readMasterBoxDropdown(@Req() req: any, @Body() params: ReadMasterQrDropdownDto): Promise<ReadMasterQrDropdownDto> {
    return await this.qrcodeService.readMasterBoxDropdown(req, params);
  }

  @ApiOperation({ summary: 'Master Box Scan.' })
  @ApiBody({ type: MasterBoxScanDto })
  @Post('/master-box-scan')
  async masterBoxScan(@Req() req: any, @Body() params: MasterBoxScanDto): Promise<MasterBoxScanDto> {
    return await this.qrcodeService.masterBoxScan(req, params);
  }
}
