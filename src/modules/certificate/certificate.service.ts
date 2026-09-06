// Get certificate by ID

import { db } from "../../lib/db";

const getCertificateById = async (certificateId: string) => {
  const certificate = await db.orm.public.MilestoneCertificate.where({
    id: certificateId,
  }).first();

  if (!certificate) {
    throw new Error("Certificate not found");
  }

  return certificate;
};

// Get certificate by public number

const getCertificateByNumber = async (certificateNo: string) => {
  const certificate = await db.orm.public.MilestoneCertificate.where({
    certificateNo,
  }).first();

  if (!certificate) {
    throw new Error("Certificate not found");
  }

  return certificate;
};

// Get user's certificates

const getMyCertificates = async (userId: string) => {
  const userMilestones = await db.orm.public.UserMilestone.where({
    userId,
  }).all();

  const certificates = await Promise.all(
    userMilestones.map((userMilestone) =>
      db.orm.public.MilestoneCertificate.where({
        userMilestoneId: userMilestone.id,
      }).first(),
    ),
  );

  return certificates.filter(
    (certificate): certificate is NonNullable<typeof certificate> =>
      certificate !== null,
  );
};

// Get user's certificate by ID

const getMyCertificateById = async (userId: string, certificateId: string) => {
  const certificate = await getCertificateById(certificateId);

  const userMilestone = await db.orm.public.UserMilestone.where({
    id: certificate.userMilestoneId,
  }).first();

  if (!userMilestone) {
    throw new Error("Milestone achievement not found");
  }

  if (userMilestone.userId !== userId) {
    throw new Error("You cannot access this certificate");
  }

  return certificate;
};

// Public verification

const verifyCertificate = async (certificateNumber: string) => {
  const certificate = await getCertificateByNumber(certificateNumber);

  const userMilestone = await db.orm.public.UserMilestone.where({
    id: certificate.userMilestoneId,
  }).first();

  if (!userMilestone) {
    throw new Error("Certificate achievement record not found");
  }

  const milestone = await db.orm.public.DonationMilestone.where({
    id: userMilestone.milestoneId,
  }).first();

  if (!milestone) {
    throw new Error("Milestone not found");
  }

  const user = await db.orm.public.User.where({
    id: userMilestone.userId,
  }).first();

  if (!user) {
    throw new Error("Certificate owner not found");
  }

  // Public verification DTO
  // Don't expose email, phone, etc.

  return {
    valid: true,
    certificateNumber: certificate.certificateNo,
    issuedAt: certificate.issuedAt,
    milestone: {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      donationCount: milestone.donationCount,
    },

    recipient: {
      id: user.id,
      name: user.name,
    },
  };
};

export const CertificateService = {
  getCertificateById,
  getCertificateByNumber,
  getMyCertificates,
  getMyCertificateById,
  verifyCertificate,
};
