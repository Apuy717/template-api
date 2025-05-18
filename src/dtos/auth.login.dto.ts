import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class AuthLoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 20) // Minimum and maximum length of the password
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/, {
    message: "Password too weak. It must contain at least one lowercase letter, one uppercase letter, one digit, and one special character."
  })
  password: string
}