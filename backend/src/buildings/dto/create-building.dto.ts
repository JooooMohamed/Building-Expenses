import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}

class BuildingSettingsDto {
  @IsString()
  @IsOptional()
  paymentGateway?: string;

  @IsNumber()
  @IsOptional()
  lateFeePercentage?: number;

  @IsNumber()
  @IsOptional()
  dueDayOfMonth?: number;
}

export class CreateBuildingDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsNumber()
  @Min(1)
  totalUnits: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @ValidateNested()
  @Type(() => BuildingSettingsDto)
  @IsOptional()
  settings?: BuildingSettingsDto;
}

export class UpdateBuildingDto {
  @IsString()
  @IsOptional()
  name?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @IsNumber()
  @IsOptional()
  totalUnits?: number;

  @ValidateNested()
  @Type(() => BuildingSettingsDto)
  @IsOptional()
  settings?: BuildingSettingsDto;
}
