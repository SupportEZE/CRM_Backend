import { Controller, Patch, Post, Query, Req, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { EnquiryStrategyFactory } from "./enquiry-strategy.factory";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ClientInterceptor } from "src/interceptors/client.interceptor";
import { ClientDto } from "src/decorators/client-dto.decorator";
import { WEB_DTO_MAP } from "./dto-map";
// import {
//   PostalCodeService
// } from '../../master/location-master/postal-code/web/postal-code.service';
@ApiTags('Web-Enquiry')
@ApiBearerAuth('Authorization')
@Controller('enquiry')
@UseInterceptors(ClientInterceptor)
export class EnquiryController {
  constructor(private strategyFactory: EnquiryStrategyFactory) { }

  @ApiOperation({
    summary: 'Create an Enquiry',
    description: 'Allows users to create a new enquiry record.',
  })
  @Post('create')
  async create(@Req() req, @ClientDto(WEB_DTO_MAP.create) params: any) {    
    const service = this.strategyFactory.getStrategy(req.client);
    return service.createEnquiry(req, params);
  }

  @ApiOperation({ summary: 'Read All Enquiry', description: 'Allows users to update enquiry record.' })
  @Post('read')
  async getAll(@Req() req, @ClientDto(WEB_DTO_MAP.read) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.getAllEnquiries(req, params);
  }

  @ApiOperation({ summary: 'Update an Enquiry', description: 'Allows users to update enquiry record.' })
  @Patch('update')
  async updateEnquiry(@Req() req, @ClientDto(WEB_DTO_MAP.update) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.updateEnquiry(req, params);
  }

  @ApiOperation({ summary: 'Enquiry Status Update' })
  @Patch('status-update')
  async updateStatus(@Req() req, @ClientDto(WEB_DTO_MAP.statusUpdate) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Read Enquiry detail', description: 'Allows users to fetch enquiry detail.' })
  @Post('detail')
  async detail(@Req() req, @ClientDto(WEB_DTO_MAP.detail) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.detail(req, params);
  }

  @ApiOperation({ summary: 'Detail Enquiry' })
  @Post('check-exist-enquiry')
  async findByExistEnquiry(@Req() req, @ClientDto(WEB_DTO_MAP.checkExistEnquiry) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.findByExistEnquiry(req, params);
  }

  @ApiOperation({ summary: 'Save Stages' })
  @Post('save-stage')
  async saveStages(@Req() req, @ClientDto(WEB_DTO_MAP.saveStage) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.saveStages(req, params);
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
  @Post('activities')
  async activities(@Query() params: any, @Req() req) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.activities(req, params);
  }

  @ApiOperation({ summary: 'Get Docs' })
  @Post('get-doc')
  async getDocument(@Req() req, @ClientDto(WEB_DTO_MAP.getDocs) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return service.getDocument(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.'})
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const service = this.strategyFactory.getStrategy(req.client);
    return await service.upload(files, req);
  }

  @ApiOperation({ summary: 'Fetch User' })
  @Post('fetch-users')
  async fetchAssignedUsers(@Req() req, @ClientDto(WEB_DTO_MAP.stateUser) params: any) {
    const service = this.strategyFactory.getStrategy(req.client);
    return  service.fetchAssignedUsers(req, params);
  }


  // @ApiOperation({ summary: 'Get Docs' })
  // @Post('/read-using-pincode')
  // async readUsingPincode(@Req() req, @ClientDto(WEB_DTO_MAP.postalCode) params: any) {
  //   const service = this.strategyFactory.getPostalStrategy(req.client);
  //   return  service.readUsingPincode(req, params);
  // }


}

