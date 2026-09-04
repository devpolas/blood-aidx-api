import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import config from "./src/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",

    db: {
      connection: config.database_url,
    },
  }),
});
