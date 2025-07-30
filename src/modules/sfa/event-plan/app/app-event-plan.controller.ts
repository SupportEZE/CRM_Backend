import { Body, Controller, Patch, Post, Req, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { EventPlanService } from '../web/event-plan.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateEventExpenseDto, CreateEventPlanByUserDto, DetailEventPlanDto, ReadEventPlanDto, SaveParticipantDto, StatusUdateEventDto } from '../web/dto/event-plan.dto';
import { ExpenseService } from '../../expense/web/expense.service';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('App-Event')
@ApiBearerAuth('Authorization')
@Controller('app-event')
export class AppEventPlanController {
  constructor(
    private readonly eventPlanService: EventPlanService,
    private readonly expenseService: ExpenseService,
    
  ) { }

  @ApiOperation({ summary: 'Create Event Plan' })
  @ApiBody({ type: CreateEventPlanByUserDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateEventPlanByUserDto): Promise<CreateEventPlanByUserDto> {
    return await this.eventPlanService.create(req, params);
  }

  @ApiOperation({ summary: 'Event Plan List' })
  @ApiBody({ type: ReadEventPlanDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadEventPlanDto): Promise<ReadEventPlanDto> {
    return await this.eventPlanService.read(req, params);
  }

  @ApiOperation({ summary: 'Event Plan Detail' })
  @ApiBody({ type: DetailEventPlanDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: DetailEventPlanDto): Promise<DetailEventPlanDto> {
    return await this.eventPlanService.detail(req, params);
  }

  @ApiOperation({ summary: 'Add Participants' })
  @ApiBody({ type: SaveParticipantDto })
  @Post('/add-participants')
  async addParticipants(@Req() req: Request, @Body() params: SaveParticipantDto): Promise<SaveParticipantDto> {
    return this.eventPlanService.addParticipants(req, params);
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
}