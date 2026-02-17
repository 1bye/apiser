import type { ErrorResponse } from "./error";

export interface DefaultResponse<TData = unknown> {
	data: TData | null;
	error: ErrorResponse.Base<any, any, any> | null;
	metadata: Record<string, unknown>;
	success: boolean;
}
