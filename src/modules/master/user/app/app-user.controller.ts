import { Body, Controller, Post, Req, Request, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { SharedUserService } from '../shared-user.service';
import { AppUserService } from './app-user.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';
import { ReadDropdownDto } from '../web/dto/user.dto';

@Controller('app-user')
export class AppUserController {
    constructor(
        private readonly appUserService: AppUserService,
        private readonly sharedUserService: SharedUserService,
        
    ) { }
    
    @Post('/profile')
    async profile(@Req() req: Request, @Body() params: any): Promise<any> {
        return await this.appUserService.profile(req, params);
    }
    
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        return await this.sharedUserService.upload(files, req);
    }
    
    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
        return await this.sharedUserService.getDocumentByDocsId(req, params);
    }

    @Post('/read-dropdown')
    async readDropdown(@Req() req: Request, @Body() params:ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.sharedUserService.readDropdown(req, params);
}
}
