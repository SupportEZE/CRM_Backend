import { Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { EnquiryStrategyFactory } from "./enquiry-strategy.factory";
import { FilesInterceptor } from "@nestjs/platform-express";
import { APP_DTO_MAP, WEB_DTO_MAP } from "./dto-map";
import { ClientDto } from "src/decorators/client-dto.decorator";
import { ClientInterceptor } from "src/interceptors/client.interceptor";

@ApiTags('App-Enquiry')
@ApiBearerAuth('Authorization')
@Controller('app-enquiry')
@UseInterceptors(ClientInterceptor)
export class AppEnquiryController {
  constructor(private strategyFactory: EnquiryStrategyFactory) { }

  @ApiOperation({ summary: 'Create an Enquiry', description: 'Allows users to create a new enquiry record.' })
  @Post('create')
  async createEnquiry(@Req() req, @ClientDto(WEB_DTO_MAP.create) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.createEnquiry(req, params)
  }

  @ApiOperation({ summary: 'Update Enquiry' })
  @Patch('update')
  async updateEnquiry(@Req() req, @ClientDto(WEB_DTO_MAP.update) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.updateEnquiry(req, params);
  }

  @ApiOperation({ summary: 'Read an Enquiry', description: 'Allows users to create a new enquiry record.' })
  @Post('read')
  async getAllEnquiries(@Req() req, @ClientDto(WEB_DTO_MAP.read) params: any) {    
    const service = this.strategyFactory.getAppStrategy(req.client);
    return service.getAllEnquiries(req, params);
    
  }

  @ApiOperation({ summary: 'Status Update Enquiry' })
  @Patch('status-update')
  async updateStatus(@Req() req, @ClientDto(WEB_DTO_MAP.statusUpdate) params: any) {
    const service = this.strategyFactory.getAppStrategy(req.client);
    return service.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Detail Enquiry' })
  @Post('detail')
  async detail(@Req() req, @ClientDto(APP_DTO_MAP.detail) params: any) {
    const service = this.strategyFactory.getAppStrategy(req.client);
    return service.detail(req, params);
  }

  @ApiOperation({ summary: 'Save Stages' })
  @Post('save-stage')
  async saveStage(@Req() req, @ClientDto(WEB_DTO_MAP.saveStage) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.saveStages(req, params);
  }

  @ApiOperation({ summary: 'Read Comment' })
  @Post('activities')
  async activities(@Req() req, @ClientDto(WEB_DTO_MAP.readComment) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.readComments(req, params);
  }

  @ApiOperation({ summary: 'Save Comments' })
  @Post('save-comment')
  async saveComments(@Req() req, @ClientDto(WEB_DTO_MAP.saveComment) params: any) {
    const service = this.strategyFactory.getCommentStrategy(req.client);
    return service.saveComment(req, params);
  }

  @ApiOperation({ summary: 'Read Comment' })
  @Post('read-comment')
  async readComments(@Req() req, @ClientDto(WEB_DTO_MAP.readComment) params: any) {
    const service = this.strategyFactory.getCommentStrategy(req.client);
    return service.readComments(req, params);
  }
  @ApiOperation({ summary: 'Detail Enquiry' })
  @Post('check-exist-enquiry')
  async findByExistEnquiry(@Req() req, @ClientDto(WEB_DTO_MAP.checkExistEnquiry) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.findByExistEnquiry(req, params);
  }

  @ApiOperation({ summary: 'Detail Enquiry' })
  @Post('read-using-pincode')
  async readUsingPincode(@Req() req, @ClientDto(WEB_DTO_MAP.readUsingPincode) params: any) {
    const service = this.strategyFactory.getPostalStrategy(req.client);
    return service.readUsingPincode(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const service = this.strategyFactory.getStrategy(req.client);
    return await service.upload(files, req);
  }
}