#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/06ecfa0982e254cdceaf345ca6adf054159a67c85f90787f841d9213009fffb1/contract';
import endContract from '../../snapshots/06ecfa0982e254cdceaf345ca6adf054159a67c85f90787f841d9213009fffb1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c7af2d58d9b60b8b7738a61952fb57ccee9b0775af37920efe8eb00687055004/contract';
import startContract from '../../snapshots/c7af2d58d9b60b8b7738a61952fb57ccee9b0775af37920efe8eb00687055004/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dataTransform(endContract, 'typechange-blood_donations-donationNumber', {
        check: () => placeholder('typechange-blood_donations-donationNumber:check'),
        run: () => placeholder('typechange-blood_donations-donationNumber:run'),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'blood_donations',
        column: 'donationNumber',
        options: {
          qualifiedTargetType: 'text',
          formatTypeExpected: 'text',
          rawTargetTypeForLabel: 'text',
        },
      }),
      this.addUnique({
        schema: 'public',
        table: 'blood_donations',
        constraint: 'blood_donations_donationNumber_key',
        columns: ['donationNumber'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
