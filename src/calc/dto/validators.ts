import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({
  name: "CheckFrameHeight",
  async: false,
})
export class CheckFrameHeight implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    return value >= 0;
  }

  defaultMessage(): string {
    return "frameHeight не может быть отрицательным";
  }
}

@ValidatorConstraint({
  name: "CheckFrameWidth",
  async: false,
})
export class CheckFrameWidth implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    return value >= 0;
  }

  defaultMessage(): string {
    return "frameWidth не может быть отрицательным";
  }
}

@ValidatorConstraint({ name: "checkList", async: false })
export class CheckListConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [property, allowedValues] = args.constraints;
    return allowedValues.includes(value);
  }

  defaultMessage(args: ValidationArguments) {
    const [property, allowedValues] = args.constraints;
    return `${property} must have one of the allowed values: ${allowedValues.join(", ")}`;
  }
}

export function CheckListValidator<T>(
  property: string,
  allowedValues: T[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property, allowedValues],
      validator: CheckListConstraint,
    });
  };
}
