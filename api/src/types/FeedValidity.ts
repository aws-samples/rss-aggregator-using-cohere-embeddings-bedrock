export type FeedValidityCheck = {
  isValid: boolean;
  name?: string;
  reason?: string;
  reasonCode?: "CONFLICT" | "UNEXPECTED" | "INVALID";
};

export type FeedValidityCheckRequest = {
  url: string;
};
