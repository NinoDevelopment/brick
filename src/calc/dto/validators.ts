import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

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
