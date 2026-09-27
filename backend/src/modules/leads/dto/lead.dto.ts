import {
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  MaxLength,
} from 'class-validator';

export const LEAD_KINDS = ['CONTACT', 'DEMO', 'NEWSLETTER'] as const;
export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'WON',
  'CLOSED',
  'SPAM',
] as const;

export type LeadKind = (typeof LEAD_KINDS)[number];

/**
 * Accepted from the public site's route handlers, which call this endpoint
 * server-to-server. The global ValidationPipe runs with `forbidNonWhitelisted`,
 * so every field the site may send has to be declared here — that is
 * deliberate: it turns silent contract drift into a loud 400.
 */
export class CreateLeadDto {
  @IsString() @IsIn(LEAD_KINDS) kind: string;

  @IsEmail() @MaxLength(320) email: string;

  @IsString() @IsOptional() @MaxLength(120) firstName?: string;
  @IsString() @IsOptional() @MaxLength(120) lastName?: string;
  @IsString() @IsOptional() @MaxLength(40) phone?: string;
  @IsString() @IsOptional() @MaxLength(200) organizationName?: string;
  @IsString() @IsOptional() @MaxLength(160) jobTitle?: string;
  @IsString() @IsOptional() @MaxLength(120) country?: string;
  @IsString() @IsOptional() @MaxLength(200) subject?: string;
  @IsString() @IsOptional() @MaxLength(500) context?: string;
  @IsString() @IsOptional() @MaxLength(5000) message?: string;

  /** Optional attribution, e.g. "landing:contact". */
  @IsString() @IsOptional() @MaxLength(120) source?: string;
}

/** Admin triage. */
export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: string;

  @IsString() @IsOptional() @MaxLength(4000) notes?: string;
}

export class ListLeadsQueryDto {
  @IsString() @IsOptional() kind?: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() page?: string;
  @IsString() @IsOptional() limit?: string;
}
