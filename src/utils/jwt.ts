import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../config";

type TokenType = "accessToken" | "refreshToken";

const tokenConfig: Record<
  TokenType,
  {
    secret: string;
    expiresIn: SignOptions["expiresIn"];
  }
> = {
  accessToken: {
    secret: config.jwt_access_secret,
    expiresIn: config.jwt_access_expire_in,
  },
  refreshToken: {
    secret: config.jwt_refresh_secret,
    expiresIn: config.jwt_refresh_expire_in,
  },
};

export const createJWT = (
  payload: JwtPayload,
  tokenType: TokenType,
): string => {
  const { secret, expiresIn } = tokenConfig[tokenType];

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (
  token: string,
  tokenType: TokenType,
): JwtPayload => {
  const { secret } = tokenConfig[tokenType];

  return jwt.verify(token, secret) as JwtPayload;
};
