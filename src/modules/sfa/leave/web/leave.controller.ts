import { Body, Controller, Patch, Post, Req, Request, Param, Query } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveMasterDto, UpdateLeaveMasterDto, ReadLeaveMasterDto, DeleteLeaveMasterDto, ReadLeaveDto, CreateLeaveDto, LeaveDetailDto, UpdateLeaveStatusDto, ReadDocDto, DeleteLeaveDto } from './dto/leave.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';


@ApiTags('Web-Leave')
@ApiBearerAuth('Authorization')
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) { }

  @ApiBody({ type: CreateLeaveMasterDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateLeaveMasterDto): Promise<CreateLeaveMasterDto> {
    return await this.leaveService.create(req, params);
  }

  @ApiBody({ type: UpdateLeaveMasterDto })
  @Patch('/update')
  async update(@Req() req: Request, @Body() params: UpdateLeaveMasterDto): Promise<UpdateLeaveMasterDto> {
    return this.leaveService.update(req, params);
  }

  @ApiBody({ type: ReadLeaveMasterDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadLeaveMasterDto): Promise<ReadLeaveMasterDto> {
    return this.leaveService.read(req, params);
  }

  @ApiBody({ type: DeleteLeaveMasterDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteLeaveMasterDto): Promise<DeleteLeaveMasterDto> {
    return this.leaveService.update(req, params);
  }

  @ApiOperation({ summary: 'Fetch Leave Types.' })
  @Post('/leave-config')
  async getLeaveTypes(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.leaveService.getLeaveTypes(req, params);
  }

  @ApiOperation({ summary: 'Fetch Leave Data.' })
  @ApiBody({ type: ReadLeaveDto })
  @Post('/leave-read')
  async leaveRead(@Req() req: Request, @Body() params: ReadLeaveDto): Promise<ReadLeaveDto> {
    return await this.leaveService.leaveRead(req, params);
  }

  @ApiOperation({ summary: 'Create Leave.' })
  @ApiBody({ type: CreateLeaveDto })
  @Post('/leave-create')
  async leaveCreate(@Req() req: Request, @Body() params: CreateLeaveDto): Promise<CreateLeaveDto> {
    return await this.leaveService.leaveCreate(req, params);
  }

  @ApiOperation({ summary: 'Leave Detail' })
  @ApiBody({ type: LeaveDetailDto })
  @Post('/leave-detail')
  async leaveDetail(@Req() req: Request, @Body() params: LeaveDetailDto): Promise<LeaveDetailDto> {
    return await this.leaveService.leaveDetail(req, params);
  }

  @ApiOperation({ summary: 'Update Leave Status' })
  @ApiBody({ type: UpdateLeaveStatusDto })
  @Patch('/update-status')
  async updateStatus(@Req() req: Request, @Body() params: UpdateLeaveStatusDto): Promise<UpdateLeaveStatusDto> {
    return await this.leaveService.updateStatus(req, params);
  }

  @ApiOperation({ summary: 'Delet Leave' })
  @ApiBody({ type: UpdateLeaveStatusDto })
  @Patch('/delete-leave')
  async deleteLeave(@Req() req: Request, @Body() params: DeleteLeaveDto): Promise<UpdateLeaveStatusDto> {
    return await this.leaveService.delete(req, params);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: ReadDocDto): Promise<ReadDocDto> {
    return await this.leaveService.getDocumentByDocsId(req, params);
  }

}

