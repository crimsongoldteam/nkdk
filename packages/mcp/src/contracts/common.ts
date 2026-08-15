import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod/v4"

export const errorCodeSchema = z.enum([
  "confirmation_required",
  "invalid_arguments",
  "not_found",
  "sync_state_required",
  "core_error",
  "project_settings_required",
  "platform_not_found",
  "platform_component_missing",
  "unsupported_connection",
  "invalid_project_settings",
  "authentication_failed",
  "session_start_failed",
  "session_timeout",
  "platform_command_failed",
  "delivery_outcome_unknown",
  "operation_cancelled",
])

export const toolErrorOutputShape = {
  ok: z.literal(false),
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
}

export function publishedToolOutputSchema<Shape extends z.ZodRawShape>(
  successSchema: z.ZodObject<Shape>,
  fullOutputSchema: z.ZodType,
) {
  return z.strictObject(successSchema.shape).partial().extend({
    ok: z.boolean(),
    code: toolErrorOutputShape.code.optional(),
    message: toolErrorOutputShape.message.optional(),
    details: toolErrorOutputShape.details,
  }).superRefine((value, context) => {
    const result = fullOutputSchema.safeParse(value)
    if (result.success) return
    for (const issue of result.error.issues) {
      context.addIssue({ code: "custom", path: issue.path, message: issue.message })
    }
  })
}

export type ToolErrorCode = z.infer<typeof errorCodeSchema>

export interface ToolFailure extends Record<string, unknown> {
  ok: false
  code: ToolErrorCode
  message: string
  details?: unknown
}

export type ToolSuccess<T extends Record<string, unknown> = Record<string, unknown>> = Record<string, unknown> & {
  ok: true
} & T

export type ToolPayload<T extends Record<string, unknown> = Record<string, unknown>> = ToolSuccess<T> | ToolFailure

export function toolSuccess<T extends Record<string, unknown>>(payload: T): ToolSuccess<T> {
  return { ok: true, ...payload }
}

export function toolError(code: ToolErrorCode, message: string, details?: unknown): ToolFailure {
  return details === undefined ? { ok: false, code, message } : { ok: false, code, message, details }
}

export function jsonToolResult(
  payload: ToolPayload,
  presentation?: { readonly text: string; readonly resource?: ToolResourcePresentation },
): CallToolResult {
  const isValidationResult = !payload.ok
    && "code" in payload
    && String(payload.code) === "validation_failed"
  return {
    content: [
      { type: "text", text: presentation?.text ?? (payload.ok ? "Операция выполнена." : payload.message) },
      ...(presentation?.resource === undefined ? [] : [{
        type: "resource_link" as const,
        uri: presentation.resource.uri,
        name: presentation.resource.name,
        mimeType: presentation.resource.mimeType,
      }]),
    ],
    structuredContent: payload,
    ...(payload.ok || isValidationResult ? {} : { isError: true }),
  }
}

export type ToolResourcePresentation = {
  uri: string
  name: string
  mimeType: string
}

export function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
