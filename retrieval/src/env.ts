interface BackendEnv {
  pg: {
    host: string;
    port: number;
    userName: string;
    dbName: string;
  };
}

const envParser =
  (env: { [key: string]: string | undefined }) =>
  (varName: string): string | undefined => {
    const value = env[varName];
    if (typeof value === "string" && value) {
      return value;
    }

    return;
  };

export function getEnv(): BackendEnv {
  const parse = envParser(process.env);
  const pg = {
    host: parse("PG_HOST")!,
    port: parseInt(parse("PG_PORT")!, 10),
    userName: parse("PG_USER")!,
    dbName: parse("PG_DB")!,
  };

  return {
    pg,
  };
}

export const env = getEnv();
