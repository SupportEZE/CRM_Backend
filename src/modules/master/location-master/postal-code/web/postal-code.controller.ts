import { Body, Get, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { PostalCodeService } from './postal-code.service';
import { ReadPostalCodeDto, GetStatesDto, GetDistrictsDto, ReadUsingPincodeDto, CreatePostalCodeDto, UpdatePostalCodeDto, DeletePostalCodeDto } from './dto/postal-code.dto';
import { Public } from 'src/decorators/public.decorator';
import {ApiBody } from '@nestjs/swagger';
@Controller('postal-code')
export class PostalCodeController {
    constructor(private readonly postalCodeService: PostalCodeService) { }

    @Post('/read')
    @ApiBody({ type: ReadPostalCodeDto })
    async read(@Req() req: any, @Body() params: ReadPostalCodeDto): Promise<ReadPostalCodeDto> {
        return await this.postalCodeService.read(req, params);
    }

    @Public()
    @Post('/states')
    async readStates(@Req() req: any, @Body() params: GetStatesDto): Promise<GetStatesDto> {
        return await this.postalCodeService.readStates(req, params);
    }

    @Public()
    @Post('/districts')
    async readDistricts(@Req() req: any, @Body() params: GetDistrictsDto
    ): Promise<GetDistrictsDto> {
        return await this.postalCodeService.readDistricts(req, params);
    }

    @Post('/read-using-pincode')
    async readUsingPincode(@Req() req: any, @Body() params: ReadUsingPincodeDto
    ): Promise<ReadUsingPincodeDto> {
        return await this.postalCodeService.readUsingPincode(req, params);
    }
    
    @Post('/create')
    async create(@Req() req: any, @Body() params: CreatePostalCodeDto): Promise<any> {
        return await this.postalCodeService.create(req, params);
    }
    @Patch('/update')
    async update(@Req() req: any, @Body() params: UpdatePostalCodeDto): Promise<any> {
        return await this.postalCodeService.update(req, params);
    }
    @Patch('/delete')
    async delete(@Req() req: any, @Body() params: DeletePostalCodeDto): Promise<DeletePostalCodeDto> {
        return await this.postalCodeService.update(req, params);
    }
}
