import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEmail, IsIn, IsInt } from 'class-validator';

export class CreateClientDto {
  @IsString() @IsNotEmpty() companyName: string;
  @IsString() @IsNotEmpty() estateName: string;
  @IsString() @IsNotEmpty() contactPerson: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsEmail() email: string;
  @IsDateString() contractStart: string;
  @IsDateString() contractEnd: string;
  @IsNumber() monthlyFee: number;
  @IsInt() numberOfGuardsAllocated: number;
  @IsString() @IsOptional() assignedSupervisorId?: string;
  @IsString() @IsIn(['PAID', 'UNPAID', 'OVERDUE']) billingStatus: string;
  @IsString() @IsOptional() notes?: string;
}

export class UpdateClientDto {
  @IsString() @IsOptional() companyName?: string;
  @IsString() @IsOptional() estateName?: string;
  @IsString() @IsOptional() contactPerson?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsDateString() @IsOptional() contractEnd?: string;
  @IsNumber() @IsOptional() monthlyFee?: number;
  @IsInt() @IsOptional() numberOfGuardsAllocated?: number;
  @IsString() @IsOptional() @IsIn(['PAID', 'UNPAID', 'OVERDUE']) billingStatus?: string;
  @IsNumber() @IsOptional() outstandingBalance?: number;
  @IsString() @IsOptional() notes?: string;
}
