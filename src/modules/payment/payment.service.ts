import httpStatus from "http-status";

import type Stripe from "stripe";

import config from "../../config";
import { stripe } from "../../config/stripe";
import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";
import type { PaymentQueryInput, RefundPaymentInput } from "./payment.schema";

interface CreateCoffeePaymentInput {
  payerId: string;
  donorId: string;
  amount: number;
  currency: string;
  message?: string;
}

// Helpers

const getPaymentByIdInternal = async (paymentId: string) => {
  const payment = await db.orm.public.Payment.where({
    id: paymentId,
  }).first();

  if (!payment) {
    throw new AppError("Payment not found", httpStatus.NOT_FOUND);
  }

  return payment;
};

const getDonorById = async (donorId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    id: donorId,
  }).first();

  if (!donor) {
    throw new AppError("Donor not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const getPaymentFromStripeMetadata = async (
  metadata: Stripe.Metadata | null,
) => {
  const paymentId = metadata?.paymentId;

  if (!paymentId) {
    return null;
  }

  return db.orm.public.Payment.where({
    id: paymentId,
  }).first();
};

const isRefundedStatus = (status: string) => {
  return status === "refunded" || status === "partially_refunded";
};

const isTerminalPaymentStatus = (status: string) => {
  return (
    status === "failed" ||
    status === "cancelled" ||
    status === "refunded" ||
    status === "partially_refunded"
  );
};

const amountToStripeUnit = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(
      "Payment amount must be greater than zero",
      httpStatus.BAD_REQUEST,
    );
  }

  return Math.round(amount * 100);
};

const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPage = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPage,
    hasNextPage: page < totalPage,
    hasPreviousPage: page > 1,
  };
};

const applyPaymentFilters = (
  query: ReturnType<typeof db.orm.public.Payment.where>,
  filters: PaymentQueryInput,
) => {
  let result = query;

  if (filters.status) {
    result = result.where({
      status: filters.status,
    });
  }

  if (filters.type) {
    result = result.where({
      type: filters.type,
    });
  }

  if (filters.provider) {
    result = result.where({
      provider: filters.provider,
    });
  }

  if (filters.currency) {
    result = result.where({
      currency: filters.currency,
    });
  }

  if (filters.createdAtFrom) {
    result = result.where((fields) =>
      fields.createdAt.gte(filters.createdAtFrom!),
    );
  }

  if (filters.createdAtTo) {
    result = result.where((fields) =>
      fields.createdAt.lte(filters.createdAtTo!),
    );
  }

  if (filters.paidAtFrom) {
    result = result.where((fields) => fields.paidAt.gte(filters.paidAtFrom!));
  }

  if (filters.paidAtTo) {
    result = result.where((fields) => fields.paidAt.lte(filters.paidAtTo!));
  }

  return result;
};

const getPaymentOrder = (
  sortBy: PaymentQueryInput["sortBy"],
  sortOrder: PaymentQueryInput["sortOrder"],
) => {
  const direction = sortOrder === "asc" ? "asc" : "desc";

  return (fields: any) => {
    switch (sortBy) {
      case "updatedAt":
        return direction === "asc"
          ? fields.updatedAt.asc()
          : fields.updatedAt.desc();

      case "amount":
        return direction === "asc" ? fields.amount.asc() : fields.amount.desc();

      case "paidAt":
        return direction === "asc"
          ? fields.paidAt.asc({ nulls: "last" })
          : fields.paidAt.desc({ nulls: "last" });

      case "createdAt":
      default:
        return direction === "asc"
          ? fields.createdAt.asc()
          : fields.createdAt.desc();
    }
  };
};

// Create Coffee Payment

const createCoffeePayment = async ({
  payerId,
  donorId,
  amount,
  currency,
  message,
}: CreateCoffeePaymentInput) => {
  const normalizedCurrency = currency.trim().toLowerCase();

  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new AppError("Invalid currency", httpStatus.BAD_REQUEST);
  }

  const payer = await getUserById(payerId);
  const donor = await getDonorById(donorId);

  if (payer.id === donor.userId) {
    throw new AppError(
      "You cannot buy coffee for yourself",
      httpStatus.BAD_REQUEST,
    );
  }

  const donorUser = await getUserById(donor.userId);

  if (donorUser.banned) {
    throw new AppError("Cannot support a banned donor", httpStatus.FORBIDDEN);
  }

  const stripeAmount = amountToStripeUnit(amount);

  if (stripeAmount < 50) {
    throw new AppError("Payment amount is too small", httpStatus.BAD_REQUEST);
  }

  const payment = await db.orm.public.Payment.create({
    payerId,
    donorId,
    type: "donor_coffee",
    provider: "stripe",
    status: "pending",
    amount,
    refundedAmount: 0,
    currency: normalizedCurrency,
    ...(message !== undefined && {
      message,
    }),
    description: `Coffee support for ${donorUser.name}`,
  });

  try {
    const metadata = {
      paymentId: payment.id,
      payerId,
      donorId,
      paymentType: "donor_coffee",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: normalizedCurrency,
            product_data: {
              name: `Buy Coffee for ${donorUser.name}`,
              description: message ?? "Support a blood donor",
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
      },
      success_url:
        `${config.website_url}` +
        `/payment/success` +
        `?payment_id=${payment.id}`,
      cancel_url:
        `${config.website_url}` +
        `/payment/cancelled` +
        `?payment_id=${payment.id}`,
    });

    if (!session.id || !session.url) {
      throw new AppError(
        "Unable to create Stripe checkout session",
        httpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const updatedPayment = await db.orm.public.Payment.where({
      id: payment.id,
    }).update({
      stripeCheckoutSessionId: session.id,
      status: "processing",
    });

    if (!updatedPayment) {
      throw new AppError(
        "Failed to update payment",
        httpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      paymentId: updatedPayment.id,
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    await db.orm.public.Payment.where({
      id: payment.id,
    }).update({
      status: "failed",
    });

    throw error;
  }
};

// Get Payment

const getPaymentById = async (paymentId: string, userId: string) => {
  const payment = await db.orm.public.Payment.where({
    id: paymentId,
    payerId: userId,
  }).first();

  if (!payment) {
    throw new AppError("Payment not found", httpStatus.NOT_FOUND);
  }

  return payment;
};

// Admin Payment Lookup

const getPaymentByIdForAdmin = async (paymentId: string) => {
  return getPaymentByIdInternal(paymentId);
};

// Get My Payments

const getMyPayments = async (userId: string, query: PaymentQueryInput) => {
  const { page, limit, sortBy, sortOrder } = query;

  const baseQuery = applyPaymentFilters(
    db.orm.public.Payment.where({
      payerId: userId,
    }),
    query,
  );

  const aggregate = await baseQuery.aggregate((fields) => ({
    total: fields.count(),
  }));

  const total = Number(aggregate.total ?? 0);

  const payments = await baseQuery
    .orderBy(getPaymentOrder(sortBy, sortOrder))
    .offset((page - 1) * limit)
    .limit(limit)
    .all();

  return {
    data: payments,
    meta: getPaginationMeta(page, limit, total),
  };
};

// Get Donor Payments

const getDonorPayments = async (donorId: string, query: PaymentQueryInput) => {
  await getDonorById(donorId);

  const baseQuery = applyPaymentFilters(
    db.orm.public.Payment.where({
      donorId,
      status: "succeeded",
    }),
    query,
  );

  const aggregate = await baseQuery.aggregate((fields) => ({
    total: fields.count(),
  }));

  const total = Number(aggregate.total ?? 0);

  const payments = await baseQuery
    .orderBy(getPaymentOrder(query.sortBy, query.sortOrder))
    .offset((query.page - 1) * query.limit)
    .limit(query.limit)
    .all();

  return {
    data: payments,
    meta: getPaginationMeta(query.page, query.limit, total),
  };
};

// Get Payment By Stripe Payment Intent

const getPaymentByStripePaymentIntent = async (paymentIntentId: string) => {
  return db.orm.public.Payment.where({
    stripePaymentIntentId: paymentIntentId,
  }).first();
};

// Stripe: Checkout Completed

const handleCheckoutCompleted = async (
  session: Stripe.Checkout.Session,
): Promise<void> => {
  const payment = await getPaymentFromStripeMetadata(session.metadata);

  if (!payment) {
    return;
  }

  if (payment.status === "succeeded") {
    return;
  }

  if (isTerminalPaymentStatus(payment.status)) {
    return;
  }

  if (session.status !== "complete") {
    return;
  }

  if (session.payment_status !== "paid") {
    return;
  }

  const stripeAmount = session.amount_total;

  if (
    stripeAmount === null ||
    stripeAmount !== amountToStripeUnit(Number(payment.amount))
  ) {
    return;
  }

  if (session.currency && session.currency.toLowerCase() !== payment.currency) {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const customerId =
    typeof session.customer === "string" ? session.customer : null;

  if (!paymentIntentId) {
    return;
  }

  await db.orm.public.Payment.where({
    id: payment.id,
  }).update({
    status: "succeeded",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    stripeCustomerId: customerId,
    paidAt: new Date().toISOString(),
  });
};

// Stripe: Async Payment Succeeded

const handleCheckoutAsyncPaymentSucceeded = async (
  session: Stripe.Checkout.Session,
): Promise<void> => {
  await handleCheckoutCompleted(session);
};

// Stripe: Async Payment Failed

const handleCheckoutAsyncPaymentFailed = async (
  session: Stripe.Checkout.Session,
): Promise<void> => {
  const payment = await getPaymentFromStripeMetadata(session.metadata);

  if (!payment) {
    return;
  }

  if (payment.status === "succeeded") {
    return;
  }

  if (isRefundedStatus(payment.status)) {
    return;
  }

  await db.orm.public.Payment.where({
    id: payment.id,
  }).update({
    status: "failed",
  });
};

// Stripe: Checkout Expired

const handleCheckoutExpired = async (
  session: Stripe.Checkout.Session,
): Promise<void> => {
  const payment = await getPaymentFromStripeMetadata(session.metadata);

  if (!payment) {
    return;
  }

  if (payment.status === "succeeded") {
    return;
  }

  if (isRefundedStatus(payment.status)) {
    return;
  }

  if (session.status !== "expired") {
    return;
  }

  await db.orm.public.Payment.where({
    id: payment.id,
  }).update({
    status: "cancelled",
  });
};

// Stripe: Payment Intent Succeeded

const handlePaymentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> => {
  const payment = await getPaymentFromStripeMetadata(paymentIntent.metadata);

  if (!payment) {
    return;
  }

  if (payment.status === "succeeded") {
    return;
  }

  if (isTerminalPaymentStatus(payment.status)) {
    return;
  }

  if (paymentIntent.status !== "succeeded") {
    return;
  }

  if (paymentIntent.amount !== amountToStripeUnit(Number(payment.amount))) {
    return;
  }

  if (paymentIntent.currency.toLowerCase() !== payment.currency) {
    return;
  }

  const customerId =
    typeof paymentIntent.customer === "string" ? paymentIntent.customer : null;

  await db.orm.public.Payment.where({
    id: payment.id,
  }).update({
    status: "succeeded",
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId: customerId,
    paidAt: new Date().toISOString(),
  });
};

// Stripe: Payment Intent Failed

const handlePaymentFailed = async (
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> => {
  const payment = await getPaymentFromStripeMetadata(paymentIntent.metadata);

  if (!payment) {
    return;
  }

  if (payment.status === "succeeded") {
    return;
  }

  if (isRefundedStatus(payment.status)) {
    return;
  }

  if (paymentIntent.status !== "requires_payment_method") {
    return;
  }

  await db.orm.public.Payment.where({
    id: payment.id,
  }).update({
    status: "failed",
    stripePaymentIntentId: paymentIntent.id,
  });
};

// Refund Payment

const refundPayment = async ({
  paymentId,
  amount,
}: RefundPaymentInput & { paymentId: string }) => {
  const payment = await getPaymentByIdInternal(paymentId);

  if (!payment.stripePaymentIntentId) {
    throw new AppError(
      "Payment does not have a Stripe payment intent",
      httpStatus.BAD_REQUEST,
    );
  }

  if (
    payment.status !== "succeeded" &&
    payment.status !== "partially_refunded"
  ) {
    throw new AppError(
      "Only successful payments can be refunded",
      httpStatus.BAD_REQUEST,
    );
  }

  const paymentAmount = Number(payment.amount);
  const alreadyRefunded = Number(payment.refundedAmount);
  const remainingAmount = paymentAmount - alreadyRefunded;

  const refundAmount = amount === undefined ? remainingAmount : amount;

  if (refundAmount <= 0) {
    throw new AppError(
      "Refund amount must be greater than zero",
      httpStatus.BAD_REQUEST,
    );
  }

  if (refundAmount > remainingAmount) {
    throw new AppError(
      "Refund amount exceeds remaining payment amount",
      httpStatus.BAD_REQUEST,
    );
  }

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: amountToStripeUnit(refundAmount),
    metadata: {
      paymentId: payment.id,
    },
  });

  return {
    paymentId: payment.id,
    refundId: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
  };
};

// Stripe: Charge Refunded

const handleChargeRefunded = async (charge: Stripe.Charge): Promise<void> => {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : null;

  if (!paymentIntentId) {
    return;
  }

  const payment = await getPaymentByStripePaymentIntent(paymentIntentId);

  if (!payment) {
    return;
  }

  if (payment.status === "cancelled" || payment.status === "failed") {
    return;
  }

  if (charge.amount_refunded <= 0) {
    return;
  }

  const paymentAmount = Number(payment.amount);

  const refundedAmount = Math.min(charge.amount_refunded / 100, paymentAmount);

  const status =
    refundedAmount >= paymentAmount ? "refunded" : "partially_refunded";

  await db.orm.public.Payment.where({
    id: payment.id,
  }).update({
    status,
    refundedAmount,
    refundedAt: new Date().toISOString(),
  });
};

// Stripe Webhook

const handleStripeWebhook = async (event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;

    case "checkout.session.async_payment_succeeded":
      await handleCheckoutAsyncPaymentSucceeded(event.data.object);
      break;

    case "checkout.session.async_payment_failed":
      await handleCheckoutAsyncPaymentFailed(event.data.object);
      break;

    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object);
      break;

    case "payment_intent.succeeded":
      await handlePaymentSucceeded(event.data.object);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;

    case "charge.refunded":
      await handleChargeRefunded(event.data.object);
      break;

    default:
      break;
  }
};

export const PaymentService = {
  createCoffeePayment,
  getPaymentById,
  getPaymentByIdForAdmin,
  getMyPayments,
  getDonorPayments,
  refundPayment,
  handleStripeWebhook,
};
