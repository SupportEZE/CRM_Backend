import { Body, Controller, Patch, Post, Req, Request } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateRoleDto, UpdateRoleDto, AddPermissionRoleDto, DeleteRoleDto, ReadModuleDto, ReadRoleDto, ReadLoginType, RoleDropdownDto } from './dto/role.dto';

export const enum rbacRoutes {
    USER_LIST_TABS = 'user-list-tabs'
}
@Controller('rbac')
export class RbacController {
    constructor(
        private readonly rbacService: RbacService

    ) { }

    @Post('/create')
    async create(@Req() req: Request, @Body() params: CreateRoleDto): Promise<CreateRoleDto> {
        return await this.rbacService.create(req, params);
    }
    @Patch('/update')
    async update(@Req() req: Request, @Body() params: UpdateRoleDto): Promise<UpdateRoleDto> {
        return await this.rbacService.update(req, params);
    }

    @Post('/read')
    async read(@Req() req: Request, @Body() params: ReadRoleDto): Promise<ReadRoleDto> {
        return await this.rbacService.read(req, params);
    }

    @Patch('/delete')
    async delete(@Req() req: Request, @Body() params: DeleteRoleDto): Promise<DeleteRoleDto> {
        return await this.rbacService.delete(req, params);
    }

    @Post('/read-modules')
    async readModules(@Req() req: Request, @Body() params: ReadModuleDto): Promise<ReadModuleDto> {
        return await this.rbacService.readModules(req, params);
    }

    @Post('/add-permissions')
    async addPermission(@Req() req: Request, @Body() params: AddPermissionRoleDto): Promise<AddPermissionRoleDto> {
        return await this.rbacService.addPermission(req, params);
    }
    @Post('/read-login-types')
    async readLoginTypes(@Req() req: Request, @Body() params: ReadLoginType): Promise<ReadLoginType> {
        return await this.rbacService.readLoginTypes(req, params);
    }

    @Post('/read-customer-type')
    async readCustomerTypes(@Req() req: Request, @Body() params: any): Promise<any> {
        return await this.rbacService.readCustomerTypes(req, params);
    }
    @Post('/read-dropdown')
    async readDropdown(@Req() req: Request, @Body() params: RoleDropdownDto): Promise<RoleDropdownDto> {
        return await this.rbacService.readDropdown(req, params);
    }
    @Post('/user-list-tabs')
    async UserListTabs(@Req() req: Request, @Body() params: any): Promise<any> {
        return await this.rbacService.readLoginTypes(req, params);
    }
}
