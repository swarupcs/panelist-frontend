// src/lib/api-error.ts
//
// The message the server sent, or a fallback.
//
// Exists because the pattern it replaces was written inline at every call site
// as `(error as any)?.response?.data?.error?.message`, each one preceded by an
// eslint-disable comment. Inside JSX those comments are not comments — `//` is
// literal text — so six screens rendered
//
//     // eslint-disable-next-line @typescript-eslint/no-explicit-anyInvalid email or password
//
// to users, including the login page. Typing the shape properly removes the
// cast, which removes the suppression, which removes the thing that leaked.

/** The error envelope this API returns on failure. */
interface ApiErrorResponse {
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: string;
      };
    };
  };
}

/**
 * The server's own message when there is one.
 *
 * Server messages are almost always better than anything a component can
 * invent: "You have used all 5 invitations", "This invitation has already been
 * started by someone else". The fallback is for genuine transport failures,
 * where there is no response to read.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiErrorResponse)?.response?.data?.error?.message;
  return typeof message === 'string' && message.length > 0 ? message : fallback;
}

/** The server's error code, for callers that branch on it rather than display it. */
export function apiErrorCode(error: unknown): string | undefined {
  return (error as ApiErrorResponse)?.response?.data?.error?.code;
}
