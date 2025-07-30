import { _IdDto } from "src/common/dto/common.dto";
import { ReadCommentsDto, SaveCommentDto } from "../comment/web/dto/comment.dto";
import { CreateDefaultEnquiryDto, DefaultEnquiryActivitiesDto, DefaultEnquirySaveStageDto, DefaultEnquiryStatusUpdateDto, DetailDefaultEnquiryDto, ReadDefaultEnquiryDto, UpdateDefaultEnquiryDto } from "./default/web/dto/default-enquiry.dto";
import { CreateOzoneEnquiryDto, FindEnquiryByNumberDto, OzoneEnquiryStatusUpdateDto, ReadOzoneCommentsSitesDto, ReadOzoneEnquiryDto, SaveOzoneCommentSitesDto, UpdateOzoneEnquiryDto,AssignedUserStateDto } from "./ozone/web/dto/ozone-enquiry.dto";
import { ReadUsingPincodeDto } from "src/modules/master/location-master/postal-code/web/dto/postal-code.dto";

export const WEB_DTO_MAP = {
    'create': {
        '6': CreateOzoneEnquiryDto, // For Ozone 
        'default': CreateDefaultEnquiryDto,
    },
    'update': {
        '6': UpdateOzoneEnquiryDto,
        'default': UpdateDefaultEnquiryDto,
    },
    'read': {
        '6': ReadOzoneEnquiryDto,
        'default': ReadDefaultEnquiryDto
    },
    'statusUpdate': {
        '6': OzoneEnquiryStatusUpdateDto,
        'default': DefaultEnquiryStatusUpdateDto,
    },
    'detail': {
        '6': UpdateOzoneEnquiryDto,
        'default': DetailDefaultEnquiryDto,
    },
    'saveStage': {
        '6': SaveOzoneCommentSitesDto,
        'default': DefaultEnquirySaveStageDto
    },
    'activties': {
        '6': SaveOzoneCommentSitesDto,
        'default': DefaultEnquiryActivitiesDto
    },
    'saveComment': {
        '6': SaveCommentDto,
        'default': SaveCommentDto,
    },
    'readComment': {
        '6': ReadOzoneCommentsSitesDto,
        'default': ReadCommentsDto
    },
    'checkExistEnquiry': {
        '6': FindEnquiryByNumberDto,
        'default': FindEnquiryByNumberDto,
    },
    'getDocs': {
        '6': _IdDto,
        'default': _IdDto,
    },
    'stateUser': {
        '6': AssignedUserStateDto,
        'default': AssignedUserStateDto,
    },
    "readUsingPincode":{
        '6': ReadUsingPincodeDto,
        'default': ReadUsingPincodeDto,

    }
}

export const APP_DTO_MAP = {
    'update': {
        '6': UpdateDefaultEnquiryDto,
        'default': UpdateDefaultEnquiryDto
    },
    'read': {
        '6': ReadOzoneEnquiryDto,
        'default': ReadDefaultEnquiryDto
    },
    'status-update': {
        '6': OzoneEnquiryStatusUpdateDto,
        'default': DefaultEnquiryStatusUpdateDto,
    },
    'detail': {
        '6': UpdateOzoneEnquiryDto,
        'default': DetailDefaultEnquiryDto
    },
    "postalCode":{
        '6': ReadUsingPincodeDto,
        'default': ReadUsingPincodeDto,

    }
};