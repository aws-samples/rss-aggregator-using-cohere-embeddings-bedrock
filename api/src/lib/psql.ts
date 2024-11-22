import { Client } from "pg";
import { env } from "../env";
import { Signer } from "@aws-sdk/rds-signer";
import * as fs from "fs";

export const sqlClient = (async (): Promise<Client> => {
  const signer = new Signer({
    region: process.env["PG_REGION"]!,
    port: env.pg.port,
    username: env.pg.userName!,
    hostname: env.pg.host,
  });

  const client = new Client({
    port: env.pg.port,
    host: env.pg.host,
    user: env.pg.userName,
    password: await signer.getAuthToken(),
    database: env.pg.dbName,
    ssl:
      process.env.USES_PROXY === "true"
        ? true
        : {
            requestCert: true,
            ca: fs.readFileSync("global-bundle.pem"),
          },
  });
  await client.connect();
  return client;
})();
