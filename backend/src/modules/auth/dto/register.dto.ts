import { IsEmail, IsString, MinLength, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'EMPLOYEE'], {
    message: 'Role must be one of: ADMIN, EMPLOYEE',
  })
  role?: string;

  @IsString()
  @IsOptional()
  organizationName?: string;
}
