import crypto from "crypto";

import {
  deleteCache,
  getCache,
  setCache,
  setCacheKeepTtl,
} from "../../lib/redis";

import { Time } from "../../utils/timeHelper";

const OTP_LENGTH = 6;
const OTP_EXPIRATION = Time.minute(15);
const OTP_EXPIRATION_SECONDS = OTP_EXPIRATION / 1000;
const OTP_MAX_ATTEMPTS = 3;

interface OtpCache {
  otp: string;
  attempts: number;
}

const generateOtpCode = (): string => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;

  return crypto.randomInt(min, max).toString();
};

export const generateOtp = async (identifier: string): Promise<string> => {
  const otp = generateOtpCode();

  const key = `otp:${identifier}`;

  const data: OtpCache = {
    otp,
    attempts: OTP_MAX_ATTEMPTS,
  };

  await setCache(key, data, OTP_EXPIRATION_SECONDS);

  return otp;
};

const validateOtp = async (identifier: string, otp: string): Promise<void> => {
  const key = `otp:${identifier}`;

  const result = await getCache<OtpCache>(key);

  if (!result) {
    throw new Error("OTP has expired or does not exist");
  }

  if (result.attempts <= 0) {
    await deleteCache(key);

    throw new Error("You cannot verify OTP anymore");
  }

  if (result.otp !== otp) {
    const remainingAttempts = result.attempts - 1;

    if (remainingAttempts <= 0) {
      await deleteCache(key);

      throw new Error("Too many invalid OTP attempts");
    }

    await setCacheKeepTtl(key, {
      otp: result.otp,
      attempts: remainingAttempts,
    });

    throw new Error(
      `Invalid OTP. ${remainingAttempts} attempt${
        remainingAttempts === 1 ? "" : "s"
      } remaining`,
    );
  }

  await deleteCache(key);
};

export const otpService = {
  generateOtp,
  validateOtp,
};
