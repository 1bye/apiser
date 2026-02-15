import type { ErrorResponse } from "./error";

export interface DefaultResponse<TData = unknown> {
  success: boolean;
  error: ErrorResponse.Base<any, any, any> | null;
  data: TData | null;
  metadata: Record<string, unknown>;
}
