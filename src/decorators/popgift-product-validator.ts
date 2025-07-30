import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ConflictException } from '@nestjs/common';
import { PopGiftItemDto } from 'src/modules/sfa/pop-gift/app/dto/app-pop-gift.dto';

export function IsUniqueProductId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueProductId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: PopGiftItemDto[], args: ValidationArguments): boolean {
          if (!Array.isArray(value)) return false;

          const seen = new Map<string, string>(); // product_id => product_name
          for (const gift of value) {
            if (seen.has(gift.product_id)) {
              // Throwing here triggers global exception handling
              throw new ConflictException({
                statusCode: 409,
                message: `Duplicate product detected: "${gift.product_name}" with ID "${gift.product_id}"`,
              });
            }
            seen.set(gift.product_id, gift.product_name);
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Duplicate product IDs are not allowed in pop_gifts array.';
        },
      },
    });
  };
}
