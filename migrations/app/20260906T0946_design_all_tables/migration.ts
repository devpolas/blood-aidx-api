#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/aa9414942bfd58974d2157117b2f4ee56ae8536cccdaec13ffd5b2e9fc47545e/contract';
import startContract from '../../snapshots/aa9414942bfd58974d2157117b2f4ee56ae8536cccdaec13ffd5b2e9fc47545e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c7af2d58d9b60b8b7738a61952fb57ccee9b0775af37920efe8eb00687055004/contract';
import endContract from '../../snapshots/c7af2d58d9b60b8b7738a61952fb57ccee9b0775af37920efe8eb00687055004/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'users_gender_check_78d2beda',
      }),
      this.dropConstraint({ schema: 'public', table: 'users', constraint: 'users_locationId_key' }),
      this.createTable({
        schema: 'public',
        table: 'audit_logs',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('entityId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('entityType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('newData', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('oldData', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'audit_logs_action_check_230d4f5a',
            "\"action\" IN ('create', 'update', 'delete', 'login', 'logout', 'verify', 'suspend', 'ban', 'restore')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'blood_donations',
        columns: [
          col('bloodGroup', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('donatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('donationNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('donorId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('rejectionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('requestId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('units', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('verifiedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('verifiedById', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'blood_donations_bloodGroup_check_9316d186',
            "\"bloodGroup\" IN ('a_positive', 'a_negative', 'b_positive', 'b_negative', 'ab_positive', 'ab_negative', 'o_positive', 'o_negative')",
          ),
          checkExpression(
            'blood_donations_status_check_32e7c165',
            "\"status\" IN ('pending', 'verified', 'rejected', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'blood_request_responses',
        columns: [
          col('acceptedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('donorId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('requestId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('respondedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'blood_request_responses_status_check_1b970c6e',
            "\"status\" IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'blood_requests',
        columns: [
          col('bloodGroup', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('hospitalName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('patientAge', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('patientName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('priority', 'text', {
            notNull: true,
            default: lit('low'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('requesterId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requiredAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('open'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('unitsFulfilled', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('unitsRequired', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'blood_requests_bloodGroup_check_9316d186',
            "\"bloodGroup\" IN ('a_positive', 'a_negative', 'b_positive', 'b_negative', 'ab_positive', 'ab_negative', 'o_positive', 'o_negative')",
          ),
          checkExpression(
            'blood_requests_priority_check_09b41aa0',
            "\"priority\" IN ('low', 'high', 'urgent')",
          ),
          checkExpression(
            'blood_requests_status_check_c1fe26b8',
            "\"status\" IN ('open', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'conversation_participants',
        columns: [
          col('conversationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('joinedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('lastReadAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'conversations',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'conversations_type_check_b2ebd55f',
            "\"type\" IN ('direct', 'blood_request', 'organization')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'donation_certificates',
        columns: [
          col('bloodGroup', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('certificateNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('certificateUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('donatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('donationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('donationNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('donorName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('issuedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('verificationCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'donation_certificates_bloodGroup_check_9316d186',
            "\"bloodGroup\" IN ('a_positive', 'a_negative', 'b_positive', 'b_negative', 'ab_positive', 'ab_negative', 'o_positive', 'o_negative')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'donation_milestones',
        columns: [
          col('badgeUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('donationCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'donor_profiles',
        columns: [
          col('availability', 'text', {
            notNull: true,
            default: lit('available'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('bloodGroup', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('eligibilityCheckedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isEligible', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('lastDonationAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('totalDonations', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'donor_profiles_availability_check_b36ba94a',
            "\"availability\" IN ('available', 'unavailable', 'temporarily_unavailable')",
          ),
          checkExpression(
            'donor_profiles_bloodGroup_check_9316d186',
            "\"bloodGroup\" IN ('a_positive', 'a_negative', 'b_positive', 'b_negative', 'ab_positive', 'ab_negative', 'o_positive', 'o_negative')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'messages',
        columns: [
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('conversationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('editedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isEdited', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('senderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'milestone_certificates',
        columns: [
          col('achievedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('certificateNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('certificateUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('donationCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('donorName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('issuedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userMilestoneId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('verificationCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'notifications',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('data', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('read', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('readAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'notifications_type_check_4d4bd755',
            "\"type\" IN ('blood_request', 'donation', 'donation_verified', 'certificate', 'milestone', 'message', 'system')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'organization_members',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('staff'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'organization_members_role_check_17a3582b',
            "\"role\" IN ('admin', 'staff', 'verifier')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'organizations',
        columns: [
          col('coverUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('logoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('registrationNo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('verifiedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('verifiedById', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('website', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'organizations_status_check_64fa6e48',
            "\"status\" IN ('pending', 'active', 'verified', 'suspended', 'rejected')",
          ),
          checkExpression(
            'organizations_type_check_c75d014d',
            "\"type\" IN ('hospital', 'blood_bank', 'clinic', 'ngo', 'other')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'reports',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reporterId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('resolvedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('resolvedById', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('targetId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'reports_status_check_8ef5f056',
            "\"status\" IN ('pending', 'reviewing', 'resolved', 'rejected')",
          ),
          checkExpression(
            'reports_type_check_d5595fb0',
            "\"type\" IN ('user', 'blood_request', 'donation', 'organization', 'message', 'review')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'reviews',
        columns: [
          col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('revieweeId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reviewerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'reviews_status_check_180312e1',
            "\"status\" IN ('pending', 'published', 'hidden', 'rejected')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user_milestones',
        columns: [
          col('achievedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('milestoneId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user_profiles',
        columns: [
          col('bio', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dateOfBirth', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'blood_donations',
        constraint: 'blood_donations_donorId_donationNumber_key',
        columns: ['donorId', 'donationNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'blood_request_responses',
        constraint: 'blood_request_responses_requestId_donorId_key',
        columns: ['requestId', 'donorId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'conversation_participants',
        constraint: 'conversation_participants_conversationId_userId_key',
        columns: ['conversationId', 'userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'donation_certificates',
        constraint: 'donation_certificates_donationId_key',
        columns: ['donationId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'donation_certificates',
        constraint: 'donation_certificates_certificateNo_key',
        columns: ['certificateNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'donation_certificates',
        constraint: 'donation_certificates_verificationCode_key',
        columns: ['verificationCode'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'donation_milestones',
        constraint: 'donation_milestones_donationCount_key',
        columns: ['donationCount'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'donor_profiles',
        constraint: 'donor_profiles_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'milestone_certificates',
        constraint: 'milestone_certificates_userMilestoneId_key',
        columns: ['userMilestoneId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'milestone_certificates',
        constraint: 'milestone_certificates_certificateNo_key',
        columns: ['certificateNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'milestone_certificates',
        constraint: 'milestone_certificates_verificationCode_key',
        columns: ['verificationCode'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'organization_members',
        constraint: 'organization_members_organizationId_userId_key',
        columns: ['organizationId', 'userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'organizations',
        constraint: 'organizations_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user_milestones',
        constraint: 'user_milestones_userId_milestoneId_key',
        columns: ['userId', 'milestoneId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user_profiles',
        constraint: 'user_profiles_userId_key',
        columns: ['userId'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'users_gender_check_4048f77b',
        expression: "\"gender\" IN ('male', 'female', 'other', 'prefer_not_to_say')",
      }),
      this.createIndex({
        schema: 'public',
        table: 'accounts',
        index: 'accounts_providerId_idx_d1904c54',
        columns: ['providerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_action_idx_cd0d2116',
        columns: ['action'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_entityType_entityId_idx_ea0fa809',
        columns: ['entityType', 'entityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_donatedAt_idx_ed7ccb5d',
        columns: ['donatedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_donorId_idx_e0e8e1e7',
        columns: ['donorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_donorId_status_donatedAt_idx_5118521b',
        columns: ['donorId', 'status', 'donatedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_requestId_idx_fd667f92',
        columns: ['requestId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_donations',
        index: 'blood_donations_verifiedById_idx_dfd74b37',
        columns: ['verifiedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_request_responses',
        index: 'blood_request_responses_donorId_idx_e0e8e1e7',
        columns: ['donorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_request_responses',
        index: 'blood_request_responses_requestId_idx_fd667f92',
        columns: ['requestId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_request_responses',
        index: 'blood_request_responses_requestId_status_idx_176fef0f',
        columns: ['requestId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_request_responses',
        index: 'blood_request_responses_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_bloodGroup_idx_54bb668e',
        columns: ['bloodGroup'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_bloodGroup_status_priority_idx_766f689c',
        columns: ['bloodGroup', 'status', 'priority'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_priority_idx_745dc344',
        columns: ['priority'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_requesterId_idx_a5f4af92',
        columns: ['requesterId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blood_requests',
        index: 'blood_requests_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation_participants',
        index: 'conversation_participants_conversationId_idx_669215a6',
        columns: ['conversationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation_participants',
        index: 'conversation_participants_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation_participants',
        index: 'conversation_participants_userId_lastReadAt_idx_2b7fec09',
        columns: ['userId', 'lastReadAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'donor_profiles',
        index: 'donor_profiles_availability_idx_90ce8149',
        columns: ['availability'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'donor_profiles',
        index: 'donor_profiles_bloodGroup_availability_isEligible_idx_9cb9bd50',
        columns: ['bloodGroup', 'availability', 'isEligible'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'donor_profiles',
        index: 'donor_profiles_bloodGroup_idx_54bb668e',
        columns: ['bloodGroup'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'donor_profiles',
        index: 'donor_profiles_isEligible_idx_f81c7dba',
        columns: ['isEligible'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversationId_createdAt_idx_44d4ac61',
        columns: ['conversationId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversationId_idx_669215a6',
        columns: ['conversationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_senderId_idx_4689c490',
        columns: ['senderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'notifications',
        index: 'notifications_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'notifications',
        index: 'notifications_userId_read_createdAt_idx_9a090bd2',
        columns: ['userId', 'read', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'notifications',
        index: 'notifications_userId_read_idx_76f3f2b6',
        columns: ['userId', 'read'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organization_members',
        index: 'organization_members_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organization_members',
        index: 'organization_members_organizationId_role_idx_35d41160',
        columns: ['organizationId', 'role'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organization_members',
        index: 'organization_members_role_idx_2c1ddf83',
        columns: ['role'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organization_members',
        index: 'organization_members_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_ownerId_idx_e2d0c1ef',
        columns: ['ownerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_type_status_idx_f045f361',
        columns: ['type', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_verifiedById_idx_dfd74b37',
        columns: ['verifiedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reports',
        index: 'reports_reporterId_idx_aa245831',
        columns: ['reporterId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reports',
        index: 'reports_resolvedById_idx_fc75edc7',
        columns: ['resolvedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reports',
        index: 'reports_status_createdAt_idx_58610442',
        columns: ['status', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reports',
        index: 'reports_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reports',
        index: 'reports_type_targetId_idx_bc55edf3',
        columns: ['type', 'targetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reviews',
        index: 'reviews_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reviews',
        index: 'reviews_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reviews',
        index: 'reviews_revieweeId_idx_00d8b149',
        columns: ['revieweeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reviews',
        index: 'reviews_revieweeId_status_idx_686146d7',
        columns: ['revieweeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reviews',
        index: 'reviews_reviewerId_idx_25a27b4e',
        columns: ['reviewerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reviews',
        index: 'reviews_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_milestones',
        index: 'user_milestones_milestoneId_idx_f1dac854',
        columns: ['milestoneId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_milestones',
        index: 'user_milestones_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_banned_idx_072711b2',
        columns: ['banned'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_locationId_idx_7aae3038',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_role_idx_2c1ddf83',
        columns: ['role'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'audit_logs',
        foreignKey: {
          name: 'audit_logs_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_donations',
        foreignKey: {
          name: 'blood_donations_donorId_fkey',
          columns: ['donorId'],
          references: { schema: 'public', table: 'donor_profiles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_donations',
        foreignKey: {
          name: 'blood_donations_requestId_fkey',
          columns: ['requestId'],
          references: { schema: 'public', table: 'blood_requests', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_donations',
        foreignKey: {
          name: 'blood_donations_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organizations', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_donations',
        foreignKey: {
          name: 'blood_donations_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'locations', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_donations',
        foreignKey: {
          name: 'blood_donations_verifiedById_fkey',
          columns: ['verifiedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_request_responses',
        foreignKey: {
          name: 'blood_request_responses_requestId_fkey',
          columns: ['requestId'],
          references: { schema: 'public', table: 'blood_requests', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_request_responses',
        foreignKey: {
          name: 'blood_request_responses_donorId_fkey',
          columns: ['donorId'],
          references: { schema: 'public', table: 'donor_profiles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_requests',
        foreignKey: {
          name: 'blood_requests_requesterId_fkey',
          columns: ['requesterId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'blood_requests',
        foreignKey: {
          name: 'blood_requests_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'locations', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversation_participants',
        foreignKey: {
          name: 'conversation_participants_conversationId_fkey',
          columns: ['conversationId'],
          references: { schema: 'public', table: 'conversations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversation_participants',
        foreignKey: {
          name: 'conversation_participants_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'donation_certificates',
        foreignKey: {
          name: 'donation_certificates_donationId_fkey',
          columns: ['donationId'],
          references: { schema: 'public', table: 'blood_donations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'donor_profiles',
        foreignKey: {
          name: 'donor_profiles_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_conversationId_fkey',
          columns: ['conversationId'],
          references: { schema: 'public', table: 'conversations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_senderId_fkey',
          columns: ['senderId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'milestone_certificates',
        foreignKey: {
          name: 'milestone_certificates_userMilestoneId_fkey',
          columns: ['userMilestoneId'],
          references: { schema: 'public', table: 'user_milestones', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'notifications',
        foreignKey: {
          name: 'notifications_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'organization_members',
        foreignKey: {
          name: 'organization_members_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organizations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'organization_members',
        foreignKey: {
          name: 'organization_members_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'organizations',
        foreignKey: {
          name: 'organizations_ownerId_fkey',
          columns: ['ownerId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'organizations',
        foreignKey: {
          name: 'organizations_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'locations', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'organizations',
        foreignKey: {
          name: 'organizations_verifiedById_fkey',
          columns: ['verifiedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reports',
        foreignKey: {
          name: 'reports_reporterId_fkey',
          columns: ['reporterId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reports',
        foreignKey: {
          name: 'reports_resolvedById_fkey',
          columns: ['resolvedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reviews',
        foreignKey: {
          name: 'reviews_reviewerId_fkey',
          columns: ['reviewerId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reviews',
        foreignKey: {
          name: 'reviews_revieweeId_fkey',
          columns: ['revieweeId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reviews',
        foreignKey: {
          name: 'reviews_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organizations', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_milestones',
        foreignKey: {
          name: 'user_milestones_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_milestones',
        foreignKey: {
          name: 'user_milestones_milestoneId_fkey',
          columns: ['milestoneId'],
          references: { schema: 'public', table: 'donation_milestones', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_profiles',
        foreignKey: {
          name: 'user_profiles_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
