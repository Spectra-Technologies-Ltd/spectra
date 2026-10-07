import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BadgeCheckInDto {
  @IsString() @IsNotEmpty() token: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsString() @IsOptional() photoUrl?: string;
  /** Device fingerprint of the phone checking in (fraud signal). */
  @IsString() @IsOptional() deviceId?: string;
  /** True when the device reports a mocked/simulated GPS fix. */
  @IsBoolean() @IsOptional() mockGpsFlag?: boolean;
}

export class BadgeProfileDto {
  @IsString() @IsNotEmpty() token: string;
}
