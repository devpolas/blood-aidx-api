import { Router } from "express";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/", PaymentController.stripeWebhook);

export default router;
