import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
  ArrayMinSize,
  IsMongoId,
} from 'class-validator';

export class RecordCashPaymentDto {
  @IsMongoId()
  residentId: string;

  @IsMongoId()
  unitId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsDateString()
  paymentDate: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expenseShareIds?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class InitiatePaymentDto {
  @IsMongoId()
  unitId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  expenseShareIds: string[];
}

export class PaymentCallbackDto {
  @IsString()
  orderId: string;

  // Gateway response fields are dynamic — validated in service
  [key: string]: string;
}
