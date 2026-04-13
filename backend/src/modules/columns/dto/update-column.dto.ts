import { IsString, IsInt, IsOptional, Min, MaxLength, MinLength } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
