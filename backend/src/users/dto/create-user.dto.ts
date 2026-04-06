import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(['admin', 'resident'])
  @IsOptional()
  role?: string;

  @IsArray()
  @IsOptional()
  unitIds?: string[];

  @IsEnum(['monthly', 'bimonthly', 'quarterly', 'biannual', 'annual'])
  @IsOptional()
  paymentFrequency?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsArray()
  @IsOptional()
  unitIds?: string[];

  @IsEnum(['monthly', 'bimonthly', 'quarterly', 'biannual', 'annual'])
  @IsOptional()
  paymentFrequency?: string;

  @IsOptional()
  isActive?: boolean;
}
