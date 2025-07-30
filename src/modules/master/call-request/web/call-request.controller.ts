import { Body, Controller, Post, Req, Patch } from '@nestjs/common';
import { CallRequestService } from './call-request.service';
import { ReadCallRequestDto, UpdateCallStatusDto } from './dto/call-request.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';



@ApiTags('web-call-request')
@ApiBearerAuth('Authorization')
@Controller('call-request')
export class CallRequestController {
  constructor(
    private readonly callRequestService: CallRequestService
  ) { }

  @ApiOperation({ summary: 'update.' })
  @ApiBody({ type: UpdateCallStatusDto })
  @Patch('/update')
  async update(@Req() req: any, @Body() params: UpdateCallStatusDto): Promise<UpdateCallStatusDto> {
    return await this.callRequestService.update(req, params);
  }

  @ApiOperation({ summary: 'list request.' })
  @ApiBody({ type: ReadCallRequestDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadCallRequestDto): Promise<ReadCallRequestDto> {
    return await this.callRequestService.read(req, params);
  }

  @ApiOperation({ summary: 'read graph.' })
  @Post('/read-graph')
  async graph(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.callRequestService.graph(req, params);
  }

  @ApiOperation({ summary: 'read month graph.' })
  @Post('/read-graph-month')
  async graphMonthWise(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.callRequestService.graphMonthWise(req, params);
  }
}