declare module "fastify" {
  export interface FastifyRequest {
    user: { id: string };
  }
}
