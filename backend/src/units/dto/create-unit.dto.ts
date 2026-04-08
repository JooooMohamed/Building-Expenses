import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsMongoId,
  Min,
} from 'class-validator';

export class CreateUnitDto {
  @IsString()
  unitNumber: string;

  @IsNumber()
  floor: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  area?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.1)
  shareCoefficient?: number;

  @IsEnum(['apartment', 'commercial', 'parking'])
  @IsOptional()
  type?: string;
}

export class UpdateUnitDto {
  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  area?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.1)
  shareCoefficient?: number;
}

export class AssignResidentDto {
  @IsMongoId()
  residentId: string;
}
