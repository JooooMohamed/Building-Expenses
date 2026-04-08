import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Matches,
} from 'class-validator';

export class GenerateChargesDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Period must be in YYYY-MM format' })
  period: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAssessmentDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Period must be in YYYY-MM format' })
  period: string;

  @IsEnum(['equal', 'by_coefficient', 'manual'])
  @IsOptional()
  distributionMethod?: string;

  @IsArray()
  @IsOptional()
  targetUnitIds?: string[]; // if manual, specify which units

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class WaiveChargeDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
