import { validate, ValidationError } from "class-validator";

class HelperValidator {
  private messages: string[] = [];

  public async GetMessages(payload: object) {
    const errors = await validate(payload);
    try {
      if (errors.length >= 1) {
        this.extractMessages(errors);
        // console.log(this.messages);
        throw { statusCode: 422, err: this.messages };
      }
      return true;
    } catch (err) {
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "Something went wrong!" }
    }
  }

  private extractMessages(errors: ValidationError[]) {
    errors.forEach((error) => {
      // Check for errors at the top level
      if (error.constraints) {
        this.messages.push(...Object.values(error.constraints));
      }

      // Recursively check for nested errors
      if (error.children && error.children.length > 0) {
        this.extractMessages(error.children);
      }
    });
  }
}

export default new HelperValidator();