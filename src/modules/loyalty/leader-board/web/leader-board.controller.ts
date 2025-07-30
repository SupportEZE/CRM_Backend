import { Body, Controller, Patch, Post, Req, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { LeaderBoardService } from './leader-board.service';
import { CreateLeaderBoardDto, ReadLeaderBoardDto, DetailLeaderBoardDto, DeleteLeaderBoardDto, UpdateLeaderStatusBoardDto } from './dto/leader-board.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Web-Leaderboard')
@ApiBearerAuth('Authorization')
@Controller('leader-board')
export class LeaderBoardController {
  constructor(private readonly leaderboardService: LeaderBoardService) { }

  @ApiOperation({ summary: 'Create Leaderboard.' })
  @ApiBody({ type: CreateLeaderBoardDto })
  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateLeaderBoardDto): Promise<any> {
    return await this.leaderboardService.create(req, params);
  }

  @ApiOperation({ summary: 'Read Leaderboard.' })
  @ApiBody({ type: ReadLeaderBoardDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadLeaderBoardDto): Promise<any> {
    return await this.leaderboardService.read(req, params);
  }

  @ApiOperation({ summary: 'Detail Leaderboard.' })
  @ApiBody({ type: DetailLeaderBoardDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: DetailLeaderBoardDto): Promise<DetailLeaderBoardDto> {
    return await this.leaderboardService.detail(req, params);
  }

  @ApiOperation({ summary: 'Delete Leaderboard.' })
  @ApiBody({ type: DeleteLeaderBoardDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteLeaderBoardDto): Promise<DeleteLeaderBoardDto> {
    return await this.leaderboardService.delete(req, params);
  }

  @ApiOperation({ summary: 'Update Leaderboard.' })
  @ApiBody({ type: UpdateLeaderStatusBoardDto })
  @Patch('/update-status')
  async updateStatus(@Req() req: Request, @Body() params: UpdateLeaderStatusBoardDto): Promise<UpdateLeaderStatusBoardDto> {
    return await this.leaderboardService.updateStatus(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.leaderboardService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.leaderboardService.getDocumentByDocsId(req, params);
  }

}
