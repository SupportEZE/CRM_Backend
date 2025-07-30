import { BadRequestException, createParamDecorator, ExecutionContext, Req } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export const ClientDto = (dtoMap: Record<string, any>) =>
    createParamDecorator(async (data, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const client_id = req['user']?.['org_id']?.toString();
        const client = client_id || 'default';
        const dtoClass = dtoMap[client] || dtoMap.default;
        if (!dtoClass) throw new BadRequestException(`No DTO class found`);
        const input = plainToInstance(dtoClass, req.body);
        const errors = await validate(input);
        if (errors.length > 0) throw new BadRequestException(errors);
        return input;
    })();