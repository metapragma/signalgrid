import { IsString, IsEnum, IsObject, IsOptional, IsDateString } from 'class-validator';

export enum SeverityEnum {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export class CreateEventDto {
  @IsString()
  type!: string;

  @IsEnum(SeverityEnum)
  severity!: SeverityEnum;

  @IsString()
  fingerprint!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  ts?: string;
}
