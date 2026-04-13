import {
  IsString, IsOptional, IsEnum, IsInt, Min, MaxLength, MinLength,
} from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
