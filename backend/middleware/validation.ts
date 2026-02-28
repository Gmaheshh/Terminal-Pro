import { ApiError } from '../utils/http';

const TICKER_REGEX = /^[A-Z0-9^.-]{1,20}$/;

export const validateTicker = (ticker?: string) => {
  if (!ticker) {
    throw new ApiError(400, 'ticker is required', 'VALIDATION_ERROR');
  }

  if (!TICKER_REGEX.test(ticker)) {
    throw new ApiError(400, 'Invalid ticker format', 'VALIDATION_ERROR');
  }
};

export const parseNumber = (input: string | undefined, fallback: number) => {
  if (!input) return fallback;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
};
