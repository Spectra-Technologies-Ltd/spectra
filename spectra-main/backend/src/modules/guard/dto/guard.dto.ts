import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsIn, IsUUID } from 'class-validator';

export class CreateGuardDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsOptional() photoUrl?: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() emergencyContact: string;
  @IsString() @IsNotEmpty() nin: string;
  @IsString() @IsOptional() bvn?: string;
  @IsString() @IsNotEmpty() guarantorDetails: string;
  @IsDateString() employmentDate: string;
  @IsString() @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE']) status: string;
  @IsString() @IsIn(['DAY', 'NIGHT', 'OFF']) currentShift: string;
  @IsString() @IsOptional() assignedSiteId?: string;
  @IsString() @IsOptional() assignedSupervisorId?: string;
}

export class UpdateGuardDto {
  @IsString() @IsOptional() fullName?: string;
  @IsString() @IsOptional() photoUrl?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() emergencyContact?: string;
  @IsString() @IsOptional() guarantorDetails?: string;
  @IsString() @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE']) status?: string;
  @IsString() @IsOptional() @IsIn(['DAY', 'NIGHT', 'OFF']) currentShift?: string;
  @IsString() @IsOptional() assignedSiteId?: string;
  @IsString() @IsOptional() assignedSupervisorId?: string;
  @IsNumber() @IsOptional() performanceScore?: number;
}

export class TransferGuardDto {
  @IsString() @IsNotEmpty() newSiteId: string;
  @IsString() @IsOptional() newSupervisorId?: string;
}
