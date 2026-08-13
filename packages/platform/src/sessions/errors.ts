export type PlatformSessionErrorCode =
  | "platform_not_found"
  | "platform_component_missing"
  | "unsupported_connection"
  | "invalid_project_settings"
  | "authentication_failed"
  | "session_start_failed"
  | "session_timeout"
  | "platform_command_failed"
  | "delivery_outcome_unknown"
  | "operation_cancelled"

import type { PlatformFailureStage } from "./runtime"
export type { PlatformFailureStage } from "./runtime"

export type PlatformFailureDetails = {
  stage: PlatformFailureStage
  mode?: PlatformSessionMode
  logPath?: string
}

export type PlatformCommandOutcome = "rejected" | "unknown"

export type PlatformSessionErrorOptions = ErrorOptions & {
  details?: PlatformFailureDetails
  commandOutcome?: PlatformCommandOutcome
}

export class PlatformSessionError extends Error {
  readonly code: PlatformSessionErrorCode
  readonly details?: PlatformFailureDetails
  readonly commandOutcome?: PlatformCommandOutcome

  constructor(code: PlatformSessionErrorCode, message: string, options?: PlatformSessionErrorOptions) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause })
    this.name = "PlatformSessionError"
    this.code = code
    if (options?.details !== undefined) this.details = options.details
    if (options?.commandOutcome !== undefined) this.commandOutcome = options.commandOutcome
  }
}
import type { PlatformSessionMode } from "./types"
