import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentModel, CommentSchema } from './models/comment.model';
import { CommentController } from './web/comment.controller';
import { CommentService } from './web/comment.service';
import { AppCommentController } from './app/app-comment.controller';
import { AppCommentService } from './app/app-comment.service';
import { ResponseService } from 'src/services/response.service';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: CommentModel.name, schema: CommentSchema },
      ]
    ),
    DropdownModule
  ],

  providers: [CommentService, AppCommentService, ResponseService],
  controllers: [CommentController, AppCommentController],
  exports:[CommentService,AppCommentService]
})
export class CommentModule {}