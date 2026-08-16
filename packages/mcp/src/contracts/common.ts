import type { CallToolResult } from "@modelcontextprotocol/server"
import { Type, type Static } from "typebox"

export const errorCodeSchema = Type.Union([
  Type.Literal("confirmation_required"),
  Type.Literal("invalid_arguments"),
  Type.Literal("not_found"),
  Type.Literal("sync_state_required"),
  Type.Literal("core_error"),
  Type.Literal("project_settings_required"),
  Type.Literal("platform_not_found"),
  Type.Literal("platform_component_missing"),
  Type.Literal("unsupported_connection"),
  Type.Literal("invalid_project_settings"),
  Type.Literal("authentication_failed"),
  Type.Literal("session_start_failed"),
  Type.Literal("session_timeout"),
  Type.Literal("platform_command_failed"),
  Type.Literal("delivery_outcome_unknown"),
  Type.Literal("operation_cancelled"),
])

export const toolErrorOutputShape = {
  ok: Type.Literal(false),
  code: errorCodeSchema,
  message: Type.String(),
  details: Type.Optional(Type.Unknown()),
}

export const toolErrorOutputSchema = Type.Object(toolErrorOutputShape)
export const strictToolErrorOutputSchema = Type.Object(toolErrorOutputShape, { additionalProperties: false })

export type ToolErrorCode = Static<typeof errorCodeSchema>

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
