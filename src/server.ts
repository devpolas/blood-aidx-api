import app from "./app";
import { db } from "./prisma/db";

db.connect()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err: any) => {
    console.log("Database failed to connect.....💥", err);
  });

const server = app.listen(3000, () => {
  console.log(`Server is running on PORT ${3000}`);
});

process.on("unhandledRejection", (err: any) => {
  console.log("unhandledRejection Error :", err);
  console.log("unhandledRejection! shutting done.....💥");
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err: any) => {
  console.log("uncaughtException Error :", err);
  console.log("uncaughtException! shutting done.....💥");
  server.close(() => {
    process.exit(1);
  });
});
