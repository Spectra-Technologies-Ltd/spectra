import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
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
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
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
