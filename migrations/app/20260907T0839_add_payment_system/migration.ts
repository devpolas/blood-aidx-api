#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/06ecfa0982e254cdceaf345ca6adf054159a67c85f90787f841d9213009fffb1/contract';
import startContract from '../../snapshots/06ecfa0982e254cdceaf345ca6adf054159a67c85f90787f841d9213009fffb1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3f300db8a505a65b57fa14e5b70713fa55c6c56acd4dcc83d1767f7b3793b68d/contract';
import endContract from '../../snapshots/3f300db8a505a65b57fa14e5b70713fa55c6c56acd4dcc83d1767f7b3793b68d/contract.json' with { type: 'json' };
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
      this.createTable({
        schema: 'public',
        table: 'payments',
        columns: [
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('usd'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('donorId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('metadata', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('paidAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('payerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('provider', 'text', {
            notNull: true,
            default: lit('stripe'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('refundedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('stripeCheckoutSessionId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('stripeCustomerId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('stripePaymentIntentId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('donor_coffee'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('payments_provider_check_ae06b403', '"provider" IN (\'stripe\')'),
          checkExpression(
            'payments_status_check_2c696f68',
            "\"status\" IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')",
          ),
          checkExpression('payments_type_check_6e9bcc94', '"type" IN (\'donor_coffee\')'),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payments',
        constraint: 'payments_stripePaymentIntentId_key',
        columns: ['stripePaymentIntentId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payments',
        constraint: 'payments_stripeCheckoutSessionId_key',
        columns: ['stripeCheckoutSessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_donorId_idx_e0e8e1e7',
        columns: ['donorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_donorId_status_createdAt_idx_f4064319',
        columns: ['donorId', 'status', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_payerId_idx_3d3ae95d',
        columns: ['payerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_payerId_status_createdAt_idx_79702fb9',
        columns: ['payerId', 'status', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_provider_idx_faf3af28',
        columns: ['provider'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payments',
        foreignKey: {
          name: 'payments_payerId_fkey',
          columns: ['payerId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payments',
        foreignKey: {
          name: 'payments_donorId_fkey',
          columns: ['donorId'],
          references: { schema: 'public', table: 'donor_profiles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
