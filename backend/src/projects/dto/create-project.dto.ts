import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsEnum(['planned', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
