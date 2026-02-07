import type { Options, ErrorOptions } from "@/options";
import type { ErrorRegistry } from ".";

export function generateDefaultErrors<TOptions extends Options>(
  _mapDefaultError: ErrorOptions.Base["mapDefaultError"]
): ErrorRegistry<TOptions> {
  const mapDefaultError = _mapDefaultError ?? ((err) => err);

  return {
    unauthorized: {
      handler: mapDefaultError({
        message: "Unauthorized",
        code: "UNAUTHORIZED",
        name: "UnauthorizedError",
      }),
      options: {
        status: 401,
        statusText: "Unauthorized",
      },
    },

    forbidden: {
      handler: mapDefaultError({
        message: "Forbidden",
        code: "FORBIDDEN",
        name: "ForbiddenError",
      }),
      options: {
        status: 403,
        statusText: "Forbidden",
      },
    },

    notFound: {
      handler: mapDefaultError({
        message: "Not Found",
        code: "NOT_FOUND",
        name: "NotFoundError",
      }),
      options: {
        status: 404,
        statusText: "Not Found",
      },
    },

    badRequest: {
      handler: mapDefaultError({
        message: "Bad Request",
        code: "BAD_REQUEST",
        name: "BadRequestError",
      }),
      options: {
        status: 400,
        statusText: "Bad Request",
      },
    },

    conflict: {
      handler: mapDefaultError({
        message: "Conflict",
        code: "CONFLICT",
        name: "ConflictError",
      }),
      options: {
        status: 409,
        statusText: "Conflict",
      },
    },

    tooMany: {
      handler: mapDefaultError({
        message: "Too Many Requests",
        code: "TOO_MANY_REQUESTS",
        name: "TooManyRequestsError",
      }),
      options: {
        status: 429,
        statusText: "Too Many Requests",
      },
    },

    internal: {
      handler: mapDefaultError({
        message: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        name: "InternalServerError",
      }),
      options: {
        status: 500,
        statusText: "Internal Server Error",
      },
    },
  };
};
