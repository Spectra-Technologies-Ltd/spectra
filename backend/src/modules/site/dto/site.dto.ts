import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, IsIn } from 'class-validator';

export class CreateSiteDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() address: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsString() @IsNotEmpty() clientId: string;
  @IsString() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) riskLevel: string;
  @IsInt() targetGuards: number;
  @IsString() @IsOptional() supervisorId?: string;
}

export class UpdateSiteDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() address?: string;
  @IsNumber() @IsOptional() latitude?: number;
  @IsNumber() @IsOptional() longitude?: number;
  @IsString() @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) riskLevel?: string;
  @IsInt() @IsOptional() targetGuards?: number;
  @IsString() @IsOptional() supervisorId?: string;
}
