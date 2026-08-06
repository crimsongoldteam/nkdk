import type { ProcessLaunch } from "./commands"
import {
  PlatformSessionError,
  type PlatformFailureStage,
  type PlatformSessionErrorCode,
} from "./errors"
import type { ProcessRunResult } from "./runtime"
import type { PlatformSessionMode } from "./types"

const PRIVATE_FILE_MODE = 0o600
const MAX_CONCISE_MESSAGE_LENGTH = 500

export interface PlatformOperationLogFileSystem {
  writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
  appendFile(path: string, content: string): Promise<void>
  chmod(path: string, mode: number): Promise<void>
}

export interface PlatformOperationLogDependencies {
  fileSystem: PlatformOperationLogFileSystem
  platform: NodeJS.Platform
  now(): Date
}

export interface PlatformOperationLog {
  readonly path: string
  readonly available: boolean
  append(message: string): Promise<boolean>
  process(
    stage: PlatformFailureStage,
    launch: ProcessLaunch,
    result: ProcessRunResult
  ): Promise<boolean>
  sanitize(value: string): string
}

export type PlatformFailureParams = {
  code: PlatformSessionErrorCode
  stage: PlatformFailureStage
  mode?: PlatformSessionMode
  log: PlatformOperationLog
  platformText: string
  fallbackMessage: string
  cause?: unknown
}

export async function createPlatformOperationLog(
  params: { path: string; secrets: readonly string[] },
  dependencies: PlatformOperationLogDependencies
): Promise<PlatformOperationLog> {
  await dependencies.fileSystem.writeFile(
    params.path,
    `${timestamp(dependencies.now())} Журнал операции платформы\n`,
    { mode: PRIVATE_FILE_MODE }
  )
  if (dependencies.platform !== "win32") {
    await dependencies.fileSystem.chmod(params.path, PRIVATE_FILE_MODE)
  }

  let available = true
  const sanitize = (value: string) => redactPlatformText(value, params.secrets)
  const append = async (message: string): Promise<boolean> => {
    if (!available) return false
    try {
      await dependencies.fileSystem.appendFile(
        params.path,
        `${timestamp(dependencies.now())} ${sanitize(message)}\n`
      )
      return true
    } catch {
      available = false
      return false
    }
  }

  return {
    path: params.path,
    get available() {
      return available
    },
    append,
    async process(stage, launch, result) {
      return append([
        `process stage=${stage}`,
        `command ${formatLaunch(launch)}`,
        [
          `exitCode=${result.exitCode}`,
          `timedOut=${result.timedOut === true}`,
          `cancelled=${result.cancelled === true}`,
          `terminationFailed=${result.terminationFailed === true}`,
        ].join(" "),
        `stdout ${result.stdout}`,
        `stderr ${result.stderr}`,
      ].join("\n"))
    },
    sanitize,
  }
}

export function redactPlatformText(value: string, secrets: readonly string[]): string {
  let sanitized = stripUnsafeControls(value)
  for (const secret of [...new Set(secrets)].filter(Boolean).sort((left, right) => right.length - left.length)) {
    sanitized = sanitized.replaceAll(secret, "***")
  }
  sanitized = sanitized.replace(
    /(--(?:database-)?password)(=|\s+)(?:"[^"]*"|'[^']*'|[^\s]+)/giu,
    "$1$2***"
  )
  return sanitized.replace(
    /(\/P(?:wd)?)(\s+)(?:"[^"]*"|'[^']*'|[^\s]+)/giu,
    "$1$2***"
  )
}

export function concisePlatformMessage(source: string, fallback: string): string {
  const firstLine = source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  return (firstLine ?? fallback).slice(0, MAX_CONCISE_MESSAGE_LENGTH)
}

export async function platformFailure(params: PlatformFailureParams): Promise<PlatformSessionError> {
  const message = params.log.sanitize(
    concisePlatformMessage(params.platformText, params.fallbackMessage)
  )
  const logged = await params.log.append(
    `failure stage=${params.stage} code=${params.code} message=${message}`
  )
  const finalMessage = logged
    ? message
    : `${message}. Журнал операции записать не удалось`
  return new PlatformSessionError(params.code, finalMessage, {
    ...(params.cause === undefined ? {} : { cause: params.cause }),
    details: {
      stage: params.stage,
      ...(params.mode === undefined ? {} : { mode: params.mode }),
      ...(logged && params.log.available ? { logPath: params.log.path } : {}),
    },
  })
}

function formatLaunch(launch: ProcessLaunch): string {
  return [launch.command, ...launch.args].join(" ")
}

function timestamp(value: Date): string {
  return `[${value.toISOString()}]`
}

function stripUnsafeControls(value: string): string {
  return value
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/gu, "")
    .replace(/[\0\b\f\v\u007F]/gu, "")
}
