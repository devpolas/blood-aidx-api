import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import config from "./config";
import notFound from "./middleware/absent.middleware";
import globalErrorController from "./middleware/error.middleware";
import { sendResponse } from "./utils/sendResponse";
import "temporal-polyfill/full/global";
import "./modules/auth/passport/local.strategy";

import authRouter from "./modules/auth/auth.routes";
import locationRouter from "./modules/location/location.routes";
import userRouter from "./modules/user/user.routes";
import userAdminRouter from "./modules/user/admin/admin-user.route";
import profileRouter from "./modules/profile/profile.route";
import donorRouter from "./modules/donor/donor.route";
import bloodRequestRouter from "./modules/blood-request/blood-request.route";
import bloodRequestResponseRouter from "./modules/blood-request-response/blood-request-response.route";
import donationRouter from "./modules/donation/donation.route";
import organizationRouter from "./modules/organization/organization.route";
import milestoneRouter from "./modules/milestone/milestone.route";
import certificateRouter from "./modules/certificate/certificate.route";
import reportRouter from "./modules/report/report.route";
import notificationRouter from "./modules/notification/notification.route";

const app: Application = express();

const isProduction = config.node_env === "production";

app.set("trust proxy", isProduction ? true : 1);

const allowedOrigins = config.origin_urls ?? [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Client-Info",
      "X-Client-Session",
      "X-Request-ID",
    ],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "100kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50kb",
  }),
);

app.get("/", (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood Aid is ready to talk!",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood Aid is healthy!",
  });
});

app.get("/version", (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Version information retrieved successfully.",
    data: {
      version: "1.0.0",
    },
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/profiles", profileRouter);
app.use("/api/v1/donors", donorRouter);
app.use("/api/v1/blood-requests", bloodRequestRouter);
app.use("/api/v1/blood-request-responses", bloodRequestResponseRouter);
app.use("/api/v1/donations", donationRouter);
app.use("/api/v1/admin/users", userAdminRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/locations", locationRouter);
app.use("/api/v1/milestones", milestoneRouter);
app.use("/api/v1/certificates", certificateRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/notifications", notificationRouter);

app.use(notFound);
app.use(globalErrorController);

export default app;
