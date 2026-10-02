export type EnvironmentalMeasurement = {
  sampledAt: string;
  basin: string;
  oxygenRate: number;
  airTemperature: number;
  waterTemperature: number;
  ph: number[];
  nitrate: number[];
  nitrite: number[];
  ammonia: number[];
};