import { NextResponse } from "next/server";

/** RFC 9457 (application/problem+json)。表示文言は返さない（ADR-029）。 */
export interface ProblemInit {
  status: number;
  code: string;
  title: string;
  instance: string;
  traceId: string;
  headers?: Record<string, string>;
}

export function problemResponse({
  status,
  code,
  title,
  instance,
  traceId,
  headers,
}: ProblemInit): NextResponse {
  return NextResponse.json(
    {
      type: "https://example.invalid/probs/" + code.replace(/_/g, "-"),
      title,
      status,
      code,
      instance,
      traceId,
    },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        ...headers,
      },
    }
  );
}
