/**
 * THE ONE LINE A FAILED ANALYSIS WRITES TO THE SERVER LOG — planning #3136,
 * DPO opinion of 2026-10-08, section 2.
 *
 * WHY NOT THE ERROR OBJECT: the AI SDK's errors carry the request and the
 * model's answer as properties (`requestBodyValues`, `responseBody`, `text`,
 * sometimes again inside `cause`). The request is the visitor's text, and the
 * answer quotes it by design. Logging the object would store both in the
 * platform's log, and the privacy page says we store neither.
 *
 * WHAT THE LINE HOLDS, AND NOTHING ELSE:
 *   kind    our own classification (a fixed word from AnalysisErrorKind)
 *   name    the error's class name, only if it looks like one
 *   status  an HTTP status code, only if it is a whole number from 100 to 599
 *
 * THE MESSAGE IS LEFT OUT ON PURPOSE. A provider's message can quote the
 * request. The price: two causes with the same kind, name and status cannot
 * be told apart from the log alone.
 *
 * It lives here and not in app/actions.ts because a "use server" file may
 * export async functions only.
 */

/** A class name as the SDK and the runtime write them: letters, digits, underscore. */
const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

export function failureLogLine(err: unknown, kind: string): string {
  let name = "-";
  let status = "-";
  if (err instanceof Error) {
    if (typeof err.name === "string" && NAME.test(err.name)) name = err.name;
    const code = (err as { statusCode?: unknown }).statusCode;
    if (typeof code === "number" && Number.isInteger(code) && code >= 100 && code <= 599) {
      status = String(code);
    }
  }
  return `[clearpath] analysis failed kind=${kind} name=${name} status=${status}`;
}
