import { Body, Controller, Patch, Post, Req, Request, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { EventPlanService } from './event-plan.service';
import { DetailEventPlanDto, ReadEventPlanDto, SaveParticipantDto, StatusUdateEventDto, CreateEventExpenseDto, CreateEventPlanByUserDto, CreateEventPlanByAdminDto } from './dto/event-plan.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ExpenseService } from '../../expense/web/expense.service';
import { _IdDto, DeleteDto } from 'src/common/dto/common.dto';

export enum EventRoutes{
  ADMIN_CREATE='/admin/create',
  USER_CREATE='/user/create',
}
@ApiTags('Web-Event')
@ApiBearerAuth('Authorization')
@Controller('event')
export class EventPlanController {
  constructor(
    private readonly eventPlanService: EventPlanService,
    private readonly expenseService: ExpenseService,
  ) { }
  
  @ApiOperation({ summary: 'Create Event Plan' })
  @ApiBody({ type: CreateEventPlanByAdminDto })
  @Post('/admin/create')
  async createByAdmin(@Req() req: Request, @Body() params: CreateEventPlanByAdminDto): Promise<CreateEventPlanByAdminDto> {
    return await this.eventPlanService.create(req, params);
  }
  
  @ApiOperation({ summary: 'Create Event Plan' })
  @ApiBody({ type: CreateEventPlanByUserDto })
  @Post('/user/create')
  async create(@Req() req: Request, @Body() params: CreateEventPlanByUserDto): Promise<CreateEventPlanByUserDto> {
    return await this.eventPlanService.create(req, params);
  }
  
  @ApiOperation({ summary: 'Read Event Plan' })
  @ApiBody({ type: ReadEventPlanDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadEventPlanDto): Promise<ReadEventPlanDto> {
    return this.eventPlanService.read(req, params);
  }
  
  @ApiOperation({ summary: 'Delete Event Plan' })
  @ApiBody({ type: DeleteDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteDto): Promise<DeleteDto> {
    return this.eventPlanService.delete(req, params);
  }
  
  @ApiOperation({ summary: 'Detail Event Plan' })
  @ApiBody({ type: DetailEventPlanDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: DetailEventPlanDto): Promise<DetailEventPlanDto> {
    return this.eventPlanService.detail(req, params);
  }
  
  @ApiOperation({ summary: 'Create Expense' })
  @ApiBody({ type: CreateEventExpenseDto })
  @Post('/add-expense')
  async addExpense(@Req() req: Request, @Body() params: CreateEventExpenseDto): Promise<CreateEventExpenseDto> {
    return this.expenseService.addExpenseFromEvent(req, params);
  }
  
  @ApiOperation({ summary: 'Event Status Update' })
  @ApiBody({ type: StatusUdateEventDto })
  @Patch('/status-update')
  async statusUpdate(@Req() req: Request, @Body() params: StatusUdateEventDto): Promise<StatusUdateEventDto> {
    return this.eventPlanService.statusUpdate(req, params);
  }
  
  @ApiOperation({ summary: 'Add Participants' })
  @ApiBody({ type: SaveParticipantDto })
  @Post('/add-participants')
  async addParticipants(@Req() req: Request, @Body() params: SaveParticipantDto): Promise<SaveParticipantDto> {
    return this.eventPlanService.addParticipants(req, params);
  }
  
  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.eventPlanService.upload(files, req);
  }
  
  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.eventPlanService.getDocumentByDocsId(req, params);
  }
  
  @Patch('/delete-file')
  async deleteFile(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.eventPlanService.deleteFile(req, params);
  }
  
}