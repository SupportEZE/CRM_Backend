import { Body, Controller, Patch, Post, Req, Request, Param, Query } from '@nestjs/common';
import { AppCommentService } from './app-comment.service';
import { AppSaveCommentDto, AppReadCommentsDto } from './dto/app-comment.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Comment')
@ApiBearerAuth('Authorization')
@Controller('app-comment')
export class AppCommentController {
    constructor(private readonly appCommentService: AppCommentService) { }

    @ApiOperation({ summary: 'Save Comment' })
    @ApiBody({ type: AppSaveCommentDto })
      @Post('/save-comment')
      async saveComment(@Req() req: any, @Body() params: AppSaveCommentDto): Promise<AppSaveCommentDto> {
        return this.appCommentService.saveComment(req, params);
      }

    @ApiOperation({ summary: 'Read Comment' })
    @ApiBody({ type: AppReadCommentsDto })
      @Post('/read-comments')
      async readComment(@Req() req: any, @Body() params: AppReadCommentsDto): Promise<AppReadCommentsDto> {
        return this.appCommentService.readComments(req, params);
      }
}