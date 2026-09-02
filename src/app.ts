import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import notFound from "./middleware/not-found";
import globalErrorController from "./middleware/error";
import config from "./config";

const app: Application = express();

const allowedOrigins = config.app_urls ?? [];

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

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "hello from blood aid api",
  });
});

app.use(notFound);
app.use(globalErrorController);

export default app;
