import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class ReportIncidentDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsString()
  @IsNotEmpty()
  @IsEnum([
    'THEFT',
    'ASSAULT',
    'TRESPASS',
    'FIRE',
    'MEDICAL',
    'ASSET_DAMAGE',
    'OTHER',
  ])
  type: string;
  @IsString()
  @IsNotEmpty()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity: string;
  @IsString() @IsNotEmpty() siteId: string;
  @IsNumber() @Min(-90) @Max(90) latitude: number;
  @IsNumber() @Min(-180) @Max(180) longitude: number;
  @IsArray() @IsOptional() @IsString({ each: true }) mediaUrls?: string[];
  @IsArray() @IsOptional() @IsString({ each: true }) involvedParties?: string[];
}

export class UpdateIncidentStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'])
  status: string;
  @IsString() @IsOptional() resolutionNotes?: string;
}

export class UpdateIncidentDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString()
  @IsOptional()
  @IsEnum([
    'THEFT',
    'ASSAULT',
    'TRESPASS',
    'FIRE',
    'MEDICAL',
    'ASSET_DAMAGE',
    'OTHER',
  ])
  type?: string;
  @IsString()
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;
  @IsString() @IsOptional() siteId?: string;
  @IsString()
  @IsOptional()
  @IsEnum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'])
  status?: string;
  @IsNumber() @IsOptional() @Min(-90) @Max(90) latitude?: number;
  @IsNumber() @IsOptional() @Min(-180) @Max(180) longitude?: number;
  @IsString() @IsOptional() resolutionNotes?: string;
  @IsString() @IsOptional() actionsTaken?: string;
  @IsArray() @IsOptional() @IsString({ each: true }) mediaUrls?: string[];
  @IsArray() @IsOptional() @IsString({ each: true }) involvedParties?: string[];
}
