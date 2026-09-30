import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IssueCardDto {
  @IsString() @IsOptional() guardId?: string;
  @IsString() @IsOptional() label?: string;
}

export class AssignCardDto {
  @IsString() @IsNotEmpty() guardId: string;
}
