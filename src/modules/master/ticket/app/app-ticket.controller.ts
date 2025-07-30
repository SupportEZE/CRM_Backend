import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AppTicketService } from './app-ticket.service';
import { TicketService } from '../web/ticket.service';
import { AppReadTicketDto, SubmitFeedbackDto, AppDetailTicketDto, SaveCommentTicketDto, ReadCommentsTicketDto } from '../app/dto/app-ticket.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommentService } from 'src/modules/sfa/comment/web/comment.service';
import { CustomerTypeService } from '../../customer-type/web/customer-type.service';
import { CreateTicketByCustomerDto, CreateTicketByUserDto } from '../web/dto/ticket.dto';
import { _IdDto } from 'src/common/dto/common.dto';


@ApiTags('App-Ticket')
@ApiBearerAuth('Authorization')
@Controller('app-ticket')
export class AppTicketController {
  constructor(
    private readonly appticketService: AppTicketService,
    private readonly ticketService: TicketService,
    private readonly commentService: CommentService,
    private readonly customerTypeService: CustomerTypeService,
    
  ) { }
  
  @Post('/customer-type')
  @ApiOperation({ summary: 'Get customer types for dropdown' })
  @ApiBody({ type: Object })
  async customerType(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.customerTypeService.readDropdown(req, params);
  }
  
  @Post('/customer/create')
  @ApiOperation({ summary: 'Create a new ticket from customer' })
  @ApiBody({ type: CreateTicketByCustomerDto })
  async customerCreate(@Req() req: any, @Body() params: CreateTicketByCustomerDto): Promise<CreateTicketByCustomerDto> {
    return await this.ticketService.create(req, params);
  }
  
  @Post('/user/create')
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiBody({ type: CreateTicketByUserDto })
  async create(@Req() req: any, @Body() params: CreateTicketByUserDto): Promise<CreateTicketByUserDto> {
    return await this.ticketService.create(req, params);
  }
  
  @Post('/read')
  @ApiOperation({ summary: 'Read ticket list with filters' })
  @ApiBody({ type: AppReadTicketDto })
  async read(@Req() req: any, @Body() params: AppReadTicketDto): Promise<any> {
    return await this.appticketService.readTicket(req, params);
  }
  
  @Post('/detail')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiBody({ type: AppDetailTicketDto })
  async detail(@Req() req: any, @Body() params: AppDetailTicketDto): Promise<AppDetailTicketDto> {
    return await this.appticketService.detailTicket(req, params);
  }
  
  @Post('/feedback')
  @ApiOperation({ summary: 'Submit feedback for a ticket' })
  @ApiBody({ type: SubmitFeedbackDto })
  async submitFeedback(@Req() req: any, @Body() params: SubmitFeedbackDto): Promise<any> {
    return await this.appticketService.submitFeedback(req, params);
  }
  
  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.ticketService.upload(files, req);
  }
  
  @ApiOperation({ summary: 'Save Comment' })
  @ApiBody({ type: SaveCommentTicketDto })
  @Post('/save-comment')
  async saveComment(@Req() req: Request, @Body() params: SaveCommentTicketDto): Promise<SaveCommentTicketDto> {
    return this.commentService.saveComment(req, params);
  }
  
  @ApiOperation({ summary: 'Read Comment' })
  @ApiBody({ type: ReadCommentsTicketDto })
  @Post('/read-comment')
  async readComments(@Req() req: Request, @Body() params: ReadCommentsTicketDto): Promise<ReadCommentsTicketDto> {
    return this.commentService.readComments(req, params);
  }
  
  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.ticketService.getDocumentByDocsId(req, params);
  }
  
}
