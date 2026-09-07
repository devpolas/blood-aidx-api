#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0037a031af7d0b40003bd38caa2963276e9b7130216863ab4acf1f39498d317a/contract';
import endContract from '../../snapshots/0037a031af7d0b40003bd38caa2963276e9b7130216863ab4acf1f39498d317a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/6182ab25ecae6c002c2d3e3ecec63b525a7d029d100cb2d9d918f129190d868d/contract';
import startContract from '../../snapshots/6182ab25ecae6c002c2d3e3ecec63b525a7d029d100cb2d9d918f129190d868d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'payments',
        column: col('refundedAmount', 'float8', {
          notNull: true,
          default: lit('0'),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.dataTransform(endContract, 'typechange-payments-amount', {
        check: () => placeholder('typechange-payments-amount:check'),
        run: () => placeholder('typechange-payments-amount:run'),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'payments',
        column: 'amount',
        options: {
          qualifiedTargetType: 'float8',
          formatTypeExpected: 'double precision',
          rawTargetTypeForLabel: 'float8',
        },
      }),
      this.dropNotNull({ schema: 'public', table: 'payments', column: 'message' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
