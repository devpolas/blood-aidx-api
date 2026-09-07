#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3f300db8a505a65b57fa14e5b70713fa55c6c56acd4dcc83d1767f7b3793b68d/contract';
import startContract from '../../snapshots/3f300db8a505a65b57fa14e5b70713fa55c6c56acd4dcc83d1767f7b3793b68d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6182ab25ecae6c002c2d3e3ecec63b525a7d029d100cb2d9d918f129190d868d/contract';
import endContract from '../../snapshots/6182ab25ecae6c002c2d3e3ecec63b525a7d029d100cb2d9d918f129190d868d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'payments',
        column: col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-payments-message', {
        check: () => placeholder('backfill-payments-message:check'),
        run: () => placeholder('backfill-payments-message:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'payments', column: 'message' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
