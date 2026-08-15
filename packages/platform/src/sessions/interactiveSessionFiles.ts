import { isAbsolute, relative, resolve, sep } from "node:path"
import { PlatformSessionError } from "./errors"
import type {
  PlatformCommandSession,
  SessionFileSystem,
  SshShell,
} from "./runtime"
import type { openPlatformCommandSession } from "./sshProtocol"
import type { NormalizedPlatformConnectionSettings } from "./types"

export type InteractiveSessionFileSystem = Pick<
  SessionFileSystem,
  "mkdir" | "realpath" | "rename" | "rm"
>

export function createInteractiveCommandSessionOpener(params: {
  openCommandSession: typeof openPlatformCommandSession
  settings: Pick<NormalizedPlatformConnectionSettings, "password" | "user">
  timeoutMs: number
  operationLog?: Parameters<typeof openPlatformCommandSession>[0]["operationLog"]
}): (
  shell: SshShell,
  onStage: NonNullable<Parameters<typeof openPlatformCommandSession>[0]["onStage"]>
) => Promise<PlatformCommandSession> {
  return (shell, onStage) => params.openCommandSession({
    shell,
    user: params.settings.user,
    password: params.settings.password,
    timeoutMs: params.timeoutMs,
    operationLog: params.operationLog,
    onStage,
  })
}

export function relativeServicePath(userServiceDir: string, path: string): string {
  return relative(userServiceDir, path).split(sep).join("/")
}

export async function checkedOperationOutputDir(
  allowedRoot: string,
  outputDir: string,
  fileSystem: Pick<SessionFileSystem, "realpath">,
  outsideMessage = "Каталог выгрузки должен находиться внутри разрешённого корня"
): Promise<string> {
  let resolvedOutputDir: string
  try {
    resolvedOutputDir = await fileSystem.realpath(outputDir)
  } catch {
    throw new PlatformSessionError(
      "platform_command_failed",
      "Не удалось канонизировать каталог выгрузки"
    )
  }
  if (!isPathInside(allowedRoot, resolvedOutputDir)) {
    throw new PlatformSessionError("platform_command_failed", outsideMessage)
  }
  return resolvedOutputDir
}

export async function prepareSessionStagingDirectory(
  stagingDir: string,
  fileSystem: Pick<SessionFileSystem, "mkdir" | "rm">,
  failureMessage: string
): Promise<void> {
  try {
    await fileSystem.rm(stagingDir)
    await fileSystem.mkdir(stagingDir)
  } catch {
    throw new PlatformSessionError("platform_command_failed", failureMessage)
  }
}

export async function publishSessionStagingDirectory(
  stagingDir: string,
  outputDir: string,
  fileSystem: Pick<SessionFileSystem, "rename" | "rm">
): Promise<void> {
  await fileSystem.rm(outputDir)
  await fileSystem.rename(stagingDir, outputDir)
}

export function isPathInside(baseDir: string, targetDir: string): boolean {
  const result = relative(resolve(baseDir), resolve(targetDir))
  return (
    result !== "" &&
    result !== ".." &&
    !result.startsWith(`..${sep}`) &&
    !isAbsolute(result)
  )
}
