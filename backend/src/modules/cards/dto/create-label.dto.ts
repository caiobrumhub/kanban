import {
  IsString, IsOptional, MaxLength, MinLength,
} from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
