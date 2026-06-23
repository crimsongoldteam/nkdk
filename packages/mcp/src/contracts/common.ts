import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod/v4"

export const errorCodeSchema = z.enum(["confirmation_required", "invalid_arguments", "not_found", "core_error"])

export const toolErrorOutputShape = {
  ok: z.literal(false),
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
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

export function jsonToolResult(payload: ToolPayload): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
    ...(payload.ok ? {} : { isError: true }),
  }
}

export function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
