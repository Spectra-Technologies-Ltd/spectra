import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class ReportIncidentDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
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
  @IsEnum(['LOW', 'WARNING', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity: string;
  @IsString() @IsNotEmpty() siteId: string;
  @IsNumber() @IsOptional() @Min(-90) @Max(90) latitude?: number;
  @IsNumber() @IsOptional() @Min(-180) @Max(180) longitude?: number;
  @IsArray() @IsOptional() @IsString({ each: true }) mediaUrls?: string[];
  @IsArray() @IsOptional() @IsString({ each: true }) involvedParties?: string[];
  /** Estimated loss or damage in NGN — feeds loss-prevented ROI. */
  @IsNumber() @IsOptional() @Min(0) lossValue?: number;
  /** Structured root cause, distinct from the free-text description. */
  @IsString() @IsOptional() rootCause?: string;
  @IsDateString() @IsOptional() firstResponseAt?: string;
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
  @IsNumber() @IsOptional() @Min(0) lossValue?: number;
  @IsString() @IsOptional() rootCause?: string;
  @IsDateString() @IsOptional() firstResponseAt?: string;
  @IsDateString() @IsOptional() resolvedAt?: string;
}
