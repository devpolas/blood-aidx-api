import { google } from "googleapis";

import config from "../config";
import { getCache, setCache, deleteCache } from "../lib/redis";
import { AppError } from "../utils/appError";
import { generateToken } from "../utils/token";

export interface GoogleProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

type GoogleOAuthClient = InstanceType<typeof google.auth.OAuth2>;

const GOOGLE_OAUTH_STATE_TTL = 15 * 60;

const getGoogleOAuthStateKey = (state: string): string => {
  return `oauth:google:state:${state}`;
};

export const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/user.birthday.read",
];

/**
 * Creates a new Google OAuth client.
 */
export const createGoogleClient = (): GoogleOAuthClient => {
  return new google.auth.OAuth2(
    config.google_client_id,
    config.google_client_secret,
    config.google_callback_url,
  );
};

/**
 * Creates and stores a temporary OAuth state in Redis.
 */
export const createGoogleOAuthState = async (): Promise<string> => {
  const state = generateToken();

  await setCache(getGoogleOAuthStateKey(state), true, GOOGLE_OAUTH_STATE_TTL);

  return state;
};

/**
 * Generates the Google OAuth authorization URL.
 */
export const getGoogleAuthUrl = (state: string): string => {
  const client = createGoogleClient();

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    scope: GOOGLE_SCOPES,
    state,
    prompt: "consent",
  });
};

/**
 * Validates and consumes the OAuth state.
 */
const validateGoogleOAuthState = async (state: string): Promise<void> => {
  const key = getGoogleOAuthStateKey(state);

  const exists = await getCache<boolean>(key);

  if (!exists) {
    throw new AppError("Google OAuth session expired or is invalid.", 400);
  }

  // OAuth state is single-use.
  await deleteCache(key);
};

/**
 * Exchanges the authorization code and
 * returns the normalized Google profile.
 */
export const getGoogleProfile = async (
  code: string,
  state: string,
): Promise<GoogleProfile> => {
  // 1. Validate OAuth state
  await validateGoogleOAuthState(state);

  // 2. Exchange authorization code for tokens
  const client = createGoogleClient();

  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new AppError("Google access token was not returned.", 400);
  }

  client.setCredentials(tokens);

  // 3. Get Google profile
  const oauth2 = google.oauth2({
    version: "v2",
    auth: client,
  });

  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.id || !profile.email) {
    throw new AppError("Google account information is incomplete.", 400);
  }
  // 4. Return normalized profile
  return {
    id: profile.id,
    email: profile.email,
    emailVerified: profile.verified_email ?? false,
    name: profile.name ?? null,
    picture: profile.picture ?? null,
  };
};
