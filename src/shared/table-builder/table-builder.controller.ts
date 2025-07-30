import { Controller, UseInterceptors, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TableBuilderService } from './table-builder.service';
import { CreateCustomTableDto, ReadHeaderDto } from './dto/custom-table.dto';
import { ReadTableDto } from './dto/custom-table.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateHeaderDto } from './dto/custom-table.dto';
@ApiTags('Web-Header-Builder')
@ApiBearerAuth('Authorization')
@Controller('table-builder')
export class TableBuildeController {
  constructor(private readonly tableBuilderService: TableBuilderService) { }

  @Post('/readHeader')
  async readHeader(@Req() req: any, @Body() params: ReadHeaderDto): Promise<any> {
    return await this.tableBuilderService.readHeader(req, params);
  }

  @Post('/createHeader')
  async createHeader(@Req() req: any, @Body() params: CreateHeaderDto): Promise<any> {
    return await this.tableBuilderService.createHeader(req, params);
  }

  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateCustomTableDto): Promise<any> {
    return await this.tableBuilderService.create(req, params);
  }



  @ApiTags('App-Header-Builder')
  @ApiBearerAuth('Authorization')
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadTableDto): Promise<any> {
    return await this.tableBuilderService.read(req, params);
  }
}
