export type PlatformSessionErrorCode =
  | "platform_not_found"
  | "platform_component_missing"
  | "unsupported_connection"
  | "invalid_project_settings"
  | "authentication_failed"
  | "session_start_failed"
  | "session_timeout"
  | "platform_command_failed"

export class PlatformSessionError extends Error {
  readonly code: PlatformSessionErrorCode

  constructor(code: PlatformSessionErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "PlatformSessionError"
    this.code = code
  }
}
