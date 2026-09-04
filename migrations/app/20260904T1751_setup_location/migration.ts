#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2d4154b721174418c0044e6a03907162b120748bbb82934b391f0f41c2a02b41/contract';
import endContract from '../../snapshots/2d4154b721174418c0044e6a03907162b120748bbb82934b391f0f41c2a02b41/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c110ad0a4d7faba22c687301e208b2ffe6bb0ec1b0c595aac0ddb2d370b10239/contract';
import startContract from '../../snapshots/c110ad0a4d7faba22c687301e208b2ffe6bb0ec1b0c595aac0ddb2d370b10239/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'locations',
        columns: [
          col('addressLine', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('district', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('division', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('latitude', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('longitude', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('postalCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('village', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('locationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_locationId_key',
        columns: ['locationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_city_idx_40fed80d',
        columns: ['city'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_country_division_district_city_idx_2693022c',
        columns: ['country', 'division', 'district', 'city'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_country_idx_c3994778',
        columns: ['country'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_district_idx_1728c727',
        columns: ['district'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_division_idx_a8a149d8',
        columns: ['division'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_postalCode_idx_0fcc3c6f',
        columns: ['postalCode'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'users',
        foreignKey: {
          name: 'users_locationId_fkey',
          columns: ['locationId'],
          references: { schema: 'public', table: 'locations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
