import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BadgeCheckInDto {
  @IsString() @IsNotEmpty() token: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsString() @IsOptional() photoUrl?: string;
}

export class BadgeProfileDto {
  @IsString() @IsNotEmpty() token: string;
}
