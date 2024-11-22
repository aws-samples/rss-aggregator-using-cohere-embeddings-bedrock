import { Client } from "pg";
import { env } from "../../env";
import { Signer } from "@aws-sdk/rds-signer";
import * as fs from 'fs';

export const sqlClient = (async (): Promise<Client> => {
  const signer = new Signer({
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

  let connected = false;
  let attempts = 0;
  while (!connected && attempts < 5) {
    try {
      await client.connect();
      connected = true;
    } catch (e) {
      console.error(e);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts += 1;
    }
  }

  return client;
})();
