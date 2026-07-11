import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ScanDto {
  @IsString() @IsNotEmpty() checkpointId: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsString() scanTime: string;
}

export class StartPatrolDto {
  @IsString() @IsNotEmpty() guardId: string;
  @IsString() @IsNotEmpty() routeId: string;
}

export class SubmitPatrolLogDto {
  @IsString() @IsNotEmpty() patrolRecordId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScanDto)
  scans: ScanDto[];
  @IsString() @IsOptional() incidentReportId?: string;
  @IsString() @IsOptional() generalNotes?: string;
}
