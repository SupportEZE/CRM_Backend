import { _IdDto } from "src/common/dto/common.dto";
import { ReadCustomerDto, UpdateCustomerProfileStatusDto, UpdateCustomerStageDto } from "./default/web/dto/customer.dto";
import { ReadOzoneCustomerDto, UpdateOzoneCustomerProfileStatusDto } from "./ozone/web/dto/ozone-customer.dto";
import { AppReadCustomerDto } from "./default/app/dto/app-customer.dto";

export const WEB_DTO_MAP = {
    'updateCustomerStages': {
        '6': UpdateCustomerStageDto,
        'default': UpdateCustomerStageDto,
    },
    'read': {
        '6': ReadOzoneCustomerDto,
        'default': ReadCustomerDto
    },
    'updateCustomerProfileStatus': {
        '6': UpdateOzoneCustomerProfileStatusDto,
        'default': UpdateCustomerProfileStatusDto
    }
}
export const APP_DTO_MAP = {
    'read': {
        '6': AppReadCustomerDto,
        'default': AppReadCustomerDto
    }
};