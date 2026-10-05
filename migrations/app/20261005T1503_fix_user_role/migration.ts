#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0037a031af7d0b40003bd38caa2963276e9b7130216863ab4acf1f39498d317a/contract';
import startContract from '../../snapshots/0037a031af7d0b40003bd38caa2963276e9b7130216863ab4acf1f39498d317a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f8607c8b1a81d4a0994d2d48b9625eb5a12c21b1f3de75249dd32040983e5e72/contract';
import endContract from '../../snapshots/f8607c8b1a81d4a0994d2d48b9625eb5a12c21b1f3de75249dd32040983e5e72/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'users_role_check_13016f52',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'users_role_check_27ba731c',
        expression: "\"role\" IN ('donor', 'moderator', 'admin')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
