import { IsString, MinLength, MaxLength, IsInt, IsOptional, Min } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
