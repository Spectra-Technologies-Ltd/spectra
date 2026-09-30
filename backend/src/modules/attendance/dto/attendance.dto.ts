import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsString() @IsOptional() guardId?: string;
  @IsString() @IsOptional() siteId?: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsString() @IsOptional() photoUrl?: string;
  /** Token read from the guard's NFC badge, when checking in by card. */
  @IsString() @IsOptional() nfcToken?: string;
}

export class CheckOutDto {
  @IsString() @IsOptional() guardId?: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsString() @IsOptional() report?: string;
}
