import { addEmbeddingToLabel$ } from "./lib/ai/embedding";
import { insertLabelToStore$ } from "./lib/store/topics";
import { topics$ } from "./lib/inputSources/labels/topics";
import { lastValueFrom } from "rxjs";
import {
  CloudFormationCustomResourceEvent,
  Context,
  CdkCustomResourceResponse,
} from "aws-lambda";

const populate = async () => {
  await lastValueFrom(topics$.pipe(addEmbeddingToLabel$, insertLabelToStore$));
};

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context,
): Promise<CdkCustomResourceResponse> => {
  const resp: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName,
  };

  switch (event.RequestType) {
    case "Update":
    case "Create":
      await populate();
      return {
        ...resp,
        Status: "SUCCESS",
      };
    case "Delete":
      return {
        ...resp,
        Status: "SUCCESS",
        Data: { Result: {} },
      };
  }
};
