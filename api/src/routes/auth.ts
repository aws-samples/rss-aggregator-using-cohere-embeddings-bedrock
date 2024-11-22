import { FastifyInstance } from "fastify";
import { jwtDecode } from "jwt-decode";

export const addAuthMiddleware = (server: FastifyInstance) => {
  /** Actual Authentication is performed in API Gateway, this merely decodes the API Token to allow us to access the user id. */
  server.addHook("preHandler", async (req, reply) => {
    const token = req.headers.authorization;

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const decoded = jwtDecode(token.replace("Bearer ", ""));
    if (!decoded.sub) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Prevent demo users from creating resources.
    const isDemoUser = decoded['cognito:groups'] ? decoded['cognito:groups']?.indexOf('demo-user') > -1 : false; 
    if (req.method.toLowerCase() != 'get' && isDemoUser) { 
      return reply.status(401).send({ error: "Unauthorized", message: `Demo users cannot perform ${req.method} requests`});
    }

    req.user = { id: decoded.sub! };
  });
};
