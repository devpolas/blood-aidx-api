import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";
import httpStatus from "http-status";

const getCertificateById = async (certificateId: string) => {
  const certificate = await db.orm.public.MilestoneCertificate.where({
    id: certificateId,
  }).first();

  if (!certificate) {
    throw new AppError("Certificate not found", httpStatus.NOT_FOUND);
  }

  return certificate;
};

const getCertificateByNumber = async (certificateNo: string) => {
  const certificate = await db.orm.public.MilestoneCertificate.where({
    certificateNo,
  }).first();

  if (!certificate) {
    throw new AppError("Certificate not found", httpStatus.NOT_FOUND);
  }

  return certificate;
};

const getUserMilestone = async (userMilestoneId: string) => {
  const userMilestone = await db.orm.public.UserMilestone.where({
    id: userMilestoneId,
  }).first();

  if (!userMilestone) {
    throw new AppError("Milestone achievement not found", httpStatus.NOT_FOUND);
  }

  return userMilestone;
};

const getMyCertificates = async (userId: string) => {
  const userMilestones = await db.orm.public.UserMilestone.where({
    userId,
  }).all();

  if (userMilestones.length === 0) {
    return [];
  }

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

const getMyCertificateById = async (userId: string, certificateId: string) => {
  const certificate = await getCertificateById(certificateId);

  const userMilestone = await getUserMilestone(certificate.userMilestoneId);

  if (userMilestone.userId !== userId) {
    throw new AppError(
      "You cannot access this certificate",
      httpStatus.FORBIDDEN,
    );
  }

  return certificate;
};

const verifyCertificate = async (certificateNumber: string) => {
  const certificate = await getCertificateByNumber(certificateNumber);

  const userMilestone = await getUserMilestone(certificate.userMilestoneId);

  const [milestone, user] = await Promise.all([
    db.orm.public.DonationMilestone.where({
      id: userMilestone.milestoneId,
    }).first(),

    db.orm.public.User.where({
      id: userMilestone.userId,
    }).first(),
  ]);

  if (!milestone) {
    throw new AppError("Milestone not found", httpStatus.NOT_FOUND);
  }

  if (!user) {
    throw new AppError("Certificate owner not found", httpStatus.NOT_FOUND);
  }

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
  getMyCertificates,
  getMyCertificateById,
  verifyCertificate,
};
