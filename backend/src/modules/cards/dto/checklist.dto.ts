import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateChecklistDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class CreateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
