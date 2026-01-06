import { IsEnum } from 'class-validator';

export enum TimeSeriesInterval {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
}

export enum TimeSeriesDuration {
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  SIX_HOURS = '6h',
  TWENTY_FOUR_HOURS = '24h',
}

export class TimeSeriesQueryDto {
  @IsEnum(TimeSeriesInterval)
  interval: TimeSeriesInterval = TimeSeriesInterval.ONE_MINUTE;

  @IsEnum(TimeSeriesDuration)
  duration: TimeSeriesDuration = TimeSeriesDuration.ONE_HOUR;
}
