import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsNumericObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isObjectWithNumberValues',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.values(value).every((v) => typeof v === 'number')
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an object with numeric values only`;
        },
      },
    });
  };
}
