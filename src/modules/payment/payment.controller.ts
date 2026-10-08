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

export const PaymentController = {
  // Create Coffee Payment

  createCoffeePayment: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateCoffeePaymentSchema.parse(req.body);

    const payment = await PaymentService.createCoffeePayment({
      payerId: user.id,
      donorId: data.donorId,
      amount: data.amount,
      currency: data.currency,
      ...(data.message !== undefined && {
        message: data.message,
      }),
    });

    sendResponse(res, {
      success: true,
      message: "Payment checkout created successfully",
      statusCode: httpStatus.CREATED,
      data: { payment },
    });
  }),

  // Get Payment

  getPayment: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const payment = await PaymentService.getPaymentById(
      req.params.paymentId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Payment retrieved successfully",
      statusCode: httpStatus.OK,
      data: { payment },
    });
  }),

  // Get My Payments

  getMyPayments: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = PaymentQuerySchema.parse(req.query);

    const result = await PaymentService.getMyPayments(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Payments retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        payments: result.data,
      },
      meta: result.meta,
    });
  }),

  // Get Donor Payments

  getDonorPayments: catchAsync(async (req: Request, res: Response) => {
    const query = PaymentQuerySchema.parse(req.query);

    const result = await PaymentService.getDonorPayments(
      req.params.donorId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "Donor payments retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        payments: result.data,
      },
      meta: result.meta,
    });
  }),

  // Admin: Get Payment

  getPaymentForAdmin: catchAsync(async (req: Request, res: Response) => {
    const payment = await PaymentService.getPaymentByIdForAdmin(
      req.params.paymentId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Payment retrieved successfully",
      statusCode: httpStatus.OK,
      data: { payment },
    });
  }),

  // Admin: Refund Payment

  refundPayment: catchAsync(async (req: Request, res: Response) => {
    const data = RefundPaymentSchema.parse(req.body);

    const payment = await PaymentService.refundPayment({
      paymentId: req.params.paymentId as string,
      ...data,
    });

    sendResponse(res, {
      success: true,
      message: "Payment refund initiated successfully",
      statusCode: httpStatus.OK,
      data: { payment },
    });
  }),

  // Stripe Webhook

  stripeWebhook: async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || Array.isArray(signature)) {
      sendResponse(res, {
        success: false,
        message: "Missing Stripe signature",
        statusCode: httpStatus.BAD_REQUEST,
      });
      return;
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

      sendResponse(res, {
        success: false,
        message: "Invalid Stripe webhook signature",
        statusCode: httpStatus.BAD_REQUEST,
      });
      return;
    }

    try {
      await PaymentService.handleStripeWebhook(event);

      sendResponse(res, {
        success: true,
        message: "Webhook received successfully",
        statusCode: httpStatus.OK,
        data: {
          received: true,
        },
      });
    } catch (error) {
      console.error("Stripe webhook processing failed:", error);

      sendResponse(res, {
        success: false,
        message: "Webhook processing failed",
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
