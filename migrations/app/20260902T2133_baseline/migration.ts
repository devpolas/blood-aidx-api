#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/53476ea54eb9b038377412afd304669a1b26eef4650d72a48362274759773f9f/contract';
import endContract from '../../snapshots/53476ea54eb9b038377412afd304669a1b26eef4650d72a48362274759773f9f/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'accounts',
        columns: [
          col('accessToken', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('accessTokenExpiresAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('accountId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('idToken', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('providerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('refreshToken', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('refreshTokenExpiresAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('scope', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'sessions',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('impersonatedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('banExpires', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('banReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('banned', 'bool', { default: lit(false), codecRef: { codecId: 'pg/bool@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('emailVerified', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('gender', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('image', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('donor'),
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
            'users_gender_check_78d2beda',
            "\"gender\" IN ('men', 'women', 'unisex')",
          ),
          checkExpression(
            'users_role_check_13016f52',
            "\"role\" IN ('donor', 'recipient', 'volunteer', 'hospital', 'blood_bank', 'moderator', 'admin')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'accounts',
        constraint: 'accounts_providerId_accountId_key',
        columns: ['providerId', 'accountId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sessions',
        constraint: 'sessions_token_key',
        columns: ['token'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'accounts',
        index: 'accounts_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'accounts',
        foreignKey: {
          name: 'accounts_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sessions',
        foreignKey: {
          name: 'sessions_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
