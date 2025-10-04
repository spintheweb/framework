// SPDX-License-Identifier: MIT
// Spin the Web component: stwResponse

/**
 * Wrapper for Response that ensures proper Server header is set
 * @param body Response body
 * @param init Response initialization options
 * @returns Response with Server header set to "Webspinner"
 */
export function secureResponse(body?: BodyInit | null, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);

  // Minimal exposure
  headers.set("Server", "Webspinner");
  headers.delete("X-Powered-By");

  // Security hardening
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'");

  return new Response(body, { ...init, headers });
}
