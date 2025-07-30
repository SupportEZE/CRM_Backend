import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Patch,
  Request,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  ReadUserDto,
  UpdateUserDto,
  UserDropdownDto,
  ReadDetailDto,
  UserStatusDto,
  DeleteUserDto,
  DuplicateDto,
  AssignedUserToStateDto,
  GetUsersByDesignationDto,
  DesignationDropdownDto,
} from './dto/user.dto';
import { SharedUserService } from '../shared-user.service';
import { _IdDto, CustomerIdDto } from 'src/common/dto/common.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UserUploadService } from '../user-upload.service';
import { DropdownService } from '../../dropdown/web/dropdown.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sharedUserService: SharedUserService,
    private readonly userUploadService: UserUploadService,
    private readonly dropdownService: DropdownService,
  ) {}

  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateUserDto): Promise<any> {
    return await this.userService.create(req, params);
  }
  @Patch('/update')
  async update(@Req() req: any, @Body() params: UpdateUserDto): Promise<any> {
    return await this.userService.update(req, params);
  }
  @Post('/read')
  async read(
    @Req() req: any,
    @Body() params: ReadUserDto,
  ): Promise<ReadUserDto> {
    return await this.userService.read(req, params);
  }

  @Post('/read-dropdown')
  async readDropdown(
    @Req() req: any,
    @Body() params: UserDropdownDto,
  ): Promise<UserDropdownDto> {
    return await this.sharedUserService.readDropdown(req, params);
  }

  @Post('/read-location-dropdown')
  async readLocationDropdown(
    @Req() req: any,
    @Body() params: UserDropdownDto,
  ): Promise<UserDropdownDto> {
    return await this.sharedUserService.readLocationDropdown(req, params);
  }

  @Post('/read-designation')
  async readDesignation(
    @Req() req: any,
    @Body() params: DesignationDropdownDto,
  ): Promise<UserDropdownDto> {
    return await this.dropdownService.readDesignation(req, params);
  }

  @Post('/read-detail')
  async detail(
    @Req() req: any,
    @Body() params: ReadDetailDto,
  ): Promise<ReadDetailDto> {
    return await this.userService.detail(req, params);
  }

  @Patch('/update-status')
  async updateStatus(
    @Req() req: Request,
    @Body() params: UserStatusDto,
  ): Promise<UserStatusDto> {
    return await this.userService.update(req, params);
  }

  @Patch('/delete')
  async delete(
    @Req() req: Request,
    @Body() params: DeleteUserDto,
  ): Promise<DeleteUserDto> {
    return await this.userService.update(req, params);
  }

  @Post('/duplicate')
  async duplicate(
    @Req() req: Request,
    @Body() params: DuplicateDto,
  ): Promise<DuplicateDto> {
    return await this.sharedUserService.duplicate(req, params);
  }

  @Post('/get-junior')
  async getJunior(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.sharedUserService.getJunior(req, params);
  }

  @Post('/assign-users')
  async getAssignUsers(
    @Req() req: Request,
    @Body() params: CustomerIdDto,
  ): Promise<CustomerIdDto> {
    return await this.sharedUserService.getAssignUsers(req, params);
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
  async getDocumentById(
    @Req() req: Request,
    @Body() params: _IdDto,
  ): Promise<_IdDto> {
    return await this.sharedUserService.getDocumentByDocsId(req, params);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importProductData(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.userUploadService.uploadUserData(req, file);
  }

  @Post('/assigned-state-to-user')
  async assignedUserToStateMapping(
    @Req() req: any,
    @Body() params: AssignedUserToStateDto,
  ): Promise<any> {
    return await this.sharedUserService.assignedUserToStateMapping(req, params);
  }

  @Post('/get-technical-user')
  async getUsersByDesignation(
    @Req() req: any,
    @Body() params: GetUsersByDesignationDto,
  ): Promise<any> {
    return await this.sharedUserService.getUsersByDesignation(req, params);
  }

  @ApiTags('Finding users by their user codes')
  @Post('/find-users-by-user-codes')
  async findUsersByUserCodes(
    @Req() req: any,
    @Body() params: GetUsersByDesignationDto,
  ): Promise<any> {
    return await this.findUsersByUserCodes(req, params);
  }

  @ApiTags('Upload sales user by csv')
  @Post('/upload-users')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUsers(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    return await this.userUploadService.uploadSalesUsers(req, file);
  }
}
