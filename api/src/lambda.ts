import awsLambdaFastify from "@fastify/aws-lambda";
import { server } from "./index";
import { logger } from "./utils/logger";

const proxy = awsLambdaFastify(server);

exports.handler = (event, context) => {
  logger.addContext(context);
  return proxy(event, context);
};
