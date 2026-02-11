import type { Options, ErrorOptions } from "@/options";
import type { ErrorRegistry } from ".";
import { z } from "@apiser/zod";

export function generateDefaultErrors<TOptions extends Options>(
  _mapDefaultError: ErrorOptions.Base["mapDefaultError"]
): ErrorRegistry<TOptions> {
  const mapDefaultError = _mapDefaultError ?? ((err) => err);

  const inputSchema = z.object({
    cause: z.any().optional()
  }).optional();

  return {
    unauthorized: {
      handler: ({ input }) => mapDefaultError({
        message: "Unauthorized",
        code: "UNAUTHORIZED",
        name: "UnauthorizedError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 401,
        statusText: "Unauthorized",
      },
    },

    forbidden: {
      handler: ({ input }) => mapDefaultError({
        message: "Forbidden",
        code: "FORBIDDEN",
        name: "ForbiddenError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 403,
        statusText: "Forbidden",
      },
    },

    notFound: {
      handler: ({ input }) => mapDefaultError({
        message: "Not Found",
        code: "NOT_FOUND",
        name: "NotFoundError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 404,
        statusText: "Not Found",
      },
    },

    badRequest: {
      handler: ({ input }) => mapDefaultError({
        message: "Bad Request",
        code: "BAD_REQUEST",
        name: "BadRequestError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 400,
        statusText: "Bad Request",
      },
    },

    conflict: {
      handler: ({ input }) => mapDefaultError({
        message: "Conflict",
        code: "CONFLICT",
        name: "ConflictError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 409,
        statusText: "Conflict",
      },
    },

    tooMany: {
      handler: ({ input }) => mapDefaultError({
        message: "Too Many Requests",
        code: "TOO_MANY_REQUESTS",
        name: "TooManyRequestsError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 429,
        statusText: "Too Many Requests",
      },
    },

    internal: {
      handler: ({ input }) => mapDefaultError({
        message: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        name: "InternalServerError",
        cause: input.cause
      }),
      options: {
        input: inputSchema,
        status: 500,
        statusText: "Internal Server Error",
      },
    },
  };
};
