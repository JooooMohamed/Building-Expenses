import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(['low', 'normal', 'urgent'])
  @IsOptional()
  priority?: string;
}

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsEnum(['low', 'normal', 'urgent'])
  @IsOptional()
  priority?: string;
}
