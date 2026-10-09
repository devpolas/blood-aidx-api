#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/f3b12b37ac60d1d5c11b07b2a3b318c86a0c858ab11cb27e1607bbf8debc58df/contract';
import endContract from '../../snapshots/f3b12b37ac60d1d5c11b07b2a3b318c86a0c858ab11cb27e1607bbf8debc58df/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fcb36834b12017c72952b61d377c1baa4f5b1d5a9ba5b4f2cfadf4555a3629d6/contract';
import startContract from '../../snapshots/fcb36834b12017c72952b61d377c1baa4f5b1d5a9ba5b4f2cfadf4555a3629d6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_country_division_district_city_idx_2693022c',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_district_idx_1728c727',
      }),
      this.dropColumn({ schema: 'public', table: 'locations', column: 'district' }),
      this.createIndex({
        schema: 'public',
        table: 'locations',
        index: 'locations_country_division_city_idx_863b3cff',
        columns: ['country', 'division', 'city'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
