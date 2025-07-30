import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { CommentService } from './comment.service';
import { SaveCommentDto, ReadCommentsDto } from './dto/comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @Post('/save-comment')
  async saveComment(@Req() req: Request, @Body() params: SaveCommentDto): Promise<SaveCommentDto> {
    return this.commentService.saveComment(req, params);
  }

  @Post('/read-comment')
  async readComments(@Req() req: Request, @Body() params: ReadCommentsDto): Promise<ReadCommentsDto> {
    return this.commentService.readComments(req, params);
  }
}