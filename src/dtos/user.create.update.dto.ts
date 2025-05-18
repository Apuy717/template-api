import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, MinLength } from "class-validator";

export class UserCreateUpdateDto {
  @IsOptional()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  full_name: string;

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

  @IsNotEmpty()
  @IsUUID()
  role_id: string;

  @IsOptional()
  @IsArray()
  permission_ids: string[];
}