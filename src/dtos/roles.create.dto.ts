import { ArrayMinSize, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class RoleCreateDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  permissions: string[];
}
