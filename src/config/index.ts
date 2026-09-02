import dotenv from "dotenv";
import path from "path";
import type { StringValue } from "ms";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  origin_urls: process.env.ORIGIN_URLS?.split(",") ?? [],
  jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
  jwt_access_expire_in: process.env.JWT_ACCESS_EXPIRES_IN as StringValue,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
  stripe_secret: process.env.STRIPE_SECRET as StringValue,
  website_url: process.env.WEBSITE_URL as StringValue,
  nodemailer_user: process.env.NODEMAILER_USER as StringValue,
  nodemailer_app_password: process.env.NODEMAILER_APP_PASSWORD as StringValue,
  nodemailer_service: process.env.NODEMAILER_SERVICE as StringValue,
  nodemailer_smtp_host: process.env.SMTP_HOST,
  nodemailer_smtp_port: process.env.SMTP_PORT,
  google_client_id: process.env.GOOGLE_CLIENT_ID as StringValue,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET as StringValue,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL as StringValue,
  session_secret: process.env.SESSION_SECRET as StringValue,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME as StringValue,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY as StringValue,
  cloudinary_api_secret: process.env.CLOUDINARY_SECRET as StringValue,
};
