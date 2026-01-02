import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SeverityFilter {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export class EventsQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(SeverityFilter)
  severity?: SeverityFilter;

  @IsOptional()
  @IsString()
  type?: string;
}
