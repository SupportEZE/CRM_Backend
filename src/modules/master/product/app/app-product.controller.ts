import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { AppProductService } from './app-product.service';
import { AppProductDetailDto, AppReadProductDto, AppProductDocsDto } from './dto/app-product.dto';
import { ProductService } from '../web/product.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ReadDropdownDto } from '../web/dto/product.dto';

@ApiTags('App-Product')
@ApiBearerAuth('Authorization')
@Controller('app-product')
export class AppProductController {
  constructor(
    private readonly appProductService: AppProductService,
    private readonly productService: ProductService


  ) { }

  @ApiOperation({ summary: 'Product List' })
  @ApiBody({ type: AppReadProductDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: AppReadProductDto): Promise<AppReadProductDto> {
    return await this.appProductService.read(req, params);
  }

  @ApiOperation({ summary: 'Product Detail' })
  @ApiBody({ type: AppProductDetailDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: AppProductDetailDto): Promise<AppProductDetailDto> {
    return await this.appProductService.detail(req, params);
  }

  @Post('/read-dropdown')
  async readDropdown(@Req() req: Request, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.productService.readDropdown(req, params);
  }
  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: AppProductDocsDto): Promise<AppProductDocsDto> {
    return await this.productService.getDocumentByDocsId(req, params);
  }

  
}
