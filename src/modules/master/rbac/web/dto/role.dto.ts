import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, IsArray, IsBoolean, Equals, IsInt, ArrayMinSize, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    user_role_name: string;

    @IsObject()
    @IsOptional()
    form_data?: Record<string, any>;
}

export class ReadRoleDto {

    @IsOptional()
    @IsString()
    @MaxLength(200)
    user_role_name: string;

}

export class UpdateRoleDto {

    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    user_role_name: string;

    @IsOptional()
    @IsArray()
    @IsOptional()
    form_data?: Record<string, any>;
}

export class DeleteRoleDto {

    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' }) // Ensures only value 1 is allowed
    is_delete: number;

}


export class ReadModuleDto {

    @IsOptional()
    @IsString()
    search_key: string;

    @IsNotEmpty()
    @IsString()
    user_role_id: string;

}
export class AddPermissionRoleDto {

    @IsNotEmpty()
    @IsArray()
    permission: string;

    @IsNotEmpty()
    @IsString()
    user_role_id: string


}

export class ReadLoginType {

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    login_type_ids: number;
}

export class RoleDropdownDto {
    @IsOptional()
    @IsObject()
    filters: object;

    @IsOptional()
    @IsObject()
    sorting: object;

    @IsOptional()
    @IsNumber()
    @Min(10)
    limit: number;
}
