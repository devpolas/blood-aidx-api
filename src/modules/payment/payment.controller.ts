import type { Request, Response } from "express";

import httpStatus from "http-status";
import type Stripe from "stripe";

import config from "../../config";
import { stripe } from "../../config/stripe";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import {
  CreateCoffeePaymentSchema,
  PaymentQuerySchema,
  RefundPaymentSchema,
} from "./payment.schema";
import { PaymentService } from "./payment.service";

// Create Coffee Payment

const createCoffeePayment = catchAsync(async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  const data = CreateCoffeePaymentSchema.parse(req.body);

  const result = await PaymentService.createCoffeePayment({
    payerId: auth.user.id,
    donorId: data.donorId,
    amount: data.amount,
    currency: data.currency,
    ...(data.message !== undefined && {
      message: data.message,
    }),
  });

  return sendResponse(res, {
    success: true,
    message: "Payment checkout created successfully",
    statusCode: httpStatus.CREATED,
    data: result,
  });
});

// Get Payment

const getPayment = catchAsync(async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  const result = await PaymentService.getPaymentById(
    req.params.paymentId as string,
    auth.user.id,
  );

  return sendResponse(res, {
    success: true,
    message: "Payment retrieved successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});

// Get My Payments

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  const query = PaymentQuerySchema.parse(req.query);

  const result = await PaymentService.getMyPayments(auth.user.id, query);

  return sendResponse(res, {
    success: true,
    message: "Payments retrieved successfully",
    statusCode: httpStatus.OK,
    data: result.data,
    meta: result.meta,
  });
});

// Get Donor Payments

const getDonorPayments = catchAsync(async (req: Request, res: Response) => {
  const query = PaymentQuerySchema.parse(req.query);

  const result = await PaymentService.getDonorPayments(
    req.params.donorId as string,
    query,
  );

  return sendResponse(res, {
    success: true,
    message: "Donor payments retrieved successfully",
    statusCode: httpStatus.OK,
    data: result.data,
    meta: result.meta,
  });
});

// Admin: Get Payment

const getPaymentForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getPaymentByIdForAdmin(
    req.params.paymentId as string,
  );

  return sendResponse(res, {
    success: true,
    message: "Payment retrieved successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});

// Admin: Refund Payment

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const data = RefundPaymentSchema.parse(req.body);

  const result = await PaymentService.refundPayment({
    paymentId: req.params.paymentId as string,
    ...data,
  });

  return sendResponse(res, {
    success: true,
    message: "Payment refund initiated successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});

// Stripe Webhook

const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Missing Stripe signature",
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe_webhook_secret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Invalid Stripe webhook signature",
    });
  }

  try {
    await PaymentService.handleStripeWebhook(event);

    return res.status(httpStatus.OK).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

export const PaymentController = {
  createCoffeePayment,
  getPayment,
  getMyPayments,
  getDonorPayments,
  getPaymentForAdmin,
  refundPayment,
  stripeWebhook,
};
