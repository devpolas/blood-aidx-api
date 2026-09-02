import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import notFound from "./middleware/not-found";
import globalErrorController from "./middleware/error";

const app: Application = express();

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "hello from blood aid api",
  });
});

app.use(notFound);
app.use(globalErrorController);

export default app;
