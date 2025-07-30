import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { FormBuilderService } from './form-builder.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCustomFormDto, MergeFormDto, ReadFormsDto } from './dto/custom-form.dto';
import { FileUpload } from 'src/interceptors/fileupload.interceptor';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Web-Form-Builder')
@ApiBearerAuth('Authorization')
@Controller('form-builder')
export class FormBuildeController {
  constructor(private readonly formBuilderService: FormBuilderService) { }


  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateCustomFormDto): Promise<CreateCustomFormDto> {
    return await this.formBuilderService.create(req, params);
  }

  @ApiTags('App-Form-Builder')
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadFormsDto): Promise<ReadFormsDto> {
    return await this.formBuilderService.read(req, params);
  }

  @ApiTags('App-Form-Builder-Customers')
  @Public()
  @Post('/customer-forms')
  async customerForms(@Req() req: Request, @Body() params: ReadFormsDto): Promise<ReadFormsDto> {
    return await this.formBuilderService.read(req, params);
  }

  @Post('/merge-form')
  async mergeFormsData(@Req() req: Request, @Body() params: MergeFormDto): Promise<MergeFormDto> {
    return await this.formBuilderService.mergeFormsData(req, params);
  }
}
