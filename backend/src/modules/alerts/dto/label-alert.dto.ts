import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LabelAlertDto {
  /** Did this alert correspond to a real incident? */
  @IsBoolean()
  wasReal: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
