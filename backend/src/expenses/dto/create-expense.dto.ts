import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RecurrenceDto {
  @IsEnum(['monthly', 'quarterly', 'annual'])
  frequency: string;

  @IsNumber()
  @IsOptional()
  dayOfMonth?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CreateExpenseDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['fixed', 'maintenance', 'elevator', 'project', 'emergency'])
  category: string;

  @IsNumber()
  amount: number;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ValidateNested()
  @Type(() => RecurrenceDto)
  @IsOptional()
  recurrence?: RecurrenceDto;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsDateString()
  date: string;
}
