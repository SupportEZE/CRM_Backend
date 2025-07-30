import { Body, Controller, Post, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CloseTicketDto, ReadTicketDto, DetailTicketDto, ReadCommentsTicketDto, SaveCommentTicketDto, CreateTicketBySystemUserDto, CreateTicketByCustomerDto, CreateTicketByUserDto } from './dto/ticket.dto';
import { CommentService } from 'src/modules/sfa/comment/web/comment.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Ticket')
@ApiBearerAuth('Authorization')
@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly commentService: CommentService
  ) { }
  
  @Post('/admin/create')
  @ApiOperation({ summary: 'Create a new ticket', description: 'Creates a ticket with details such as category, priority, and description.' })
  async createBySystemUsers(@Req() req: any, @Body() params: CreateTicketBySystemUserDto): Promise<CreateTicketBySystemUserDto> {
    return await this.ticketService.create(req, params);
  }
  
  @Post('/user/create')
  @ApiOperation({ summary: 'Create a new ticket', description: 'Creates a ticket with details such as category, priority, and description.' })
  async createFromUser(@Req() req: any, @Body() params: CreateTicketByUserDto): Promise<CreateTicketByUserDto> {
    return await this.ticketService.create(req, params);
  }
  
  
  @Post('/customer/create')
  @ApiOperation({ summary: 'Create a new ticket from customer' })
  @ApiBody({ type: CreateTicketByCustomerDto })
  async customerCreate(@Req() req: any, @Body() params: CreateTicketByCustomerDto): Promise<CreateTicketByCustomerDto> {
    return await this.ticketService.create(req, params);
  }
  
  @Post('/read')
  @ApiOperation({ summary: 'Read tickets', description: 'Fetches tickets based on filters and sorting criteria.' })
  async read(@Req() req: any, @Body() params: ReadTicketDto): Promise<ReadTicketDto> {
    return await this.ticketService.read(req, params);
  }
  
  @Post('/detail')
  @ApiOperation({ summary: 'Get ticket details', description: 'Fetches details of a specific ticket by ID.' })
  async detail(@Req() req: any, @Body() params: DetailTicketDto): Promise<DetailTicketDto> {
    return await this.ticketService.detailTicket(req, params);
  }
  
  @Post('/close')
  @ApiOperation({ summary: 'Close a ticket', description: 'Marks a ticket as closed with an optional remark.' })
  async closeTicket(@Req() req: any, @Body() params: CloseTicketDto): Promise<any> {
    return await this.ticketService.closeTicket(req, params);
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
  
  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.ticketService.upload(files, req);
  }
  
  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.ticketService.getDocumentByDocsId(req, params);
  }
  
  
}
