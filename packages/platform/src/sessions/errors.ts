export type PlatformSessionErrorCode =
  | "platform_not_found"
  | "platform_component_missing"
  | "unsupported_connection"
  | "invalid_project_settings"
  | "authentication_failed"
  | "session_start_failed"
  | "session_timeout"
  | "platform_command_failed"
  | "operation_cancelled"

export type PlatformFailureStage =
  | "platform-discovery"
  | "session-start"
  | "authentication"
  | "configuration-export"
  | "platform-log"

export type PlatformFailureDetails = {
  stage: PlatformFailureStage
  mode?: PlatformSessionMode
  logPath?: string
}

export type PlatformSessionErrorOptions = ErrorOptions & {
  details?: PlatformFailureDetails
}

export class PlatformSessionError extends Error {
  readonly code: PlatformSessionErrorCode
  readonly details?: PlatformFailureDetails

  constructor(code: PlatformSessionErrorCode, message: string, options?: PlatformSessionErrorOptions) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause })
    this.name = "PlatformSessionError"
    this.code = code
    if (options?.details !== undefined) this.details = options.details
  }
}
import type { PlatformSessionMode } from "./types"
