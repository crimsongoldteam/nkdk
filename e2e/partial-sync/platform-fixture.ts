import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { findPlatform, type PlatformInstallation } from "@nkdk/platform"

export type PlatformFixtureErrorCode =
  | "platform_not_found"
  | "platform_component_missing"
  | "platform_command_failed"

export class PlatformFixtureError extends Error {
  constructor(
    readonly code: PlatformFixtureErrorCode,
    message: string,
    readonly details?: { readonly step?: string; readonly logPath?: string }
  ) {
    super(message)
    this.name = "PlatformFixtureError"
  }
}

export type PlatformFixtureDependencies = {
  findPlatform(): Promise<PlatformInstallation | undefined>
  mkdir(path: string): Promise<void>
  writeFile(path: string, content: string): Promise<void>
  runProcess(
    command: string,
    args: readonly string[],
    options: { readonly cwd: string }
  ): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }>
}

type PrepareInfobaseFixtureParams = {
  readonly baseDir: string
  readonly dataDir: string
  readonly logsDir: string
  readonly cfXmlDir: string
  readonly extensionXmlDir: string
  readonly extensionName: string
}

export async function prepareInfobaseFixture(
  params: PrepareInfobaseFixtureParams,
  dependencies: PlatformFixtureDependencies = nodeDependencies
): Promise<void> {
  const installation = await dependencies.findPlatform()
  if (installation === undefined || !installation.version.startsWith("8.3.27.")) {
    throw new PlatformFixtureError(
      "platform_not_found",
      "Не найдена поддерживаемая платформа версии 8.3.27"
    )
  }
  if (installation.ibcmdPath === undefined) {
    throw new PlatformFixtureError(
      "platform_component_missing",
      "В установке платформы отсутствует ibcmd"
    )
  }

  await dependencies.mkdir(params.dataDir)
  await dependencies.mkdir(params.logsDir)
  const operations = [
    {
      step: "create-and-load-configuration",
      logPath: join(params.logsDir, "01-create-and-load-configuration.log"),
      args: [
        "infobase",
        "create",
        `--database-path=${params.baseDir}`,
        `--data=${params.dataDir}`,
        `--import=${params.cfXmlDir}`,
        "--apply",
      ],
    },
    {
      step: "load-extension",
      logPath: join(params.logsDir, "02-load-extension.log"),
      args: [
        "infobase",
        "config",
        "import",
        `--database-path=${params.baseDir}`,
        `--data=${params.dataDir}`,
        `--extension=${params.extensionName}`,
        params.extensionXmlDir,
      ],
    },
    {
      step: "apply-extension",
      logPath: join(params.logsDir, "03-apply-extension.log"),
      args: [
        "infobase",
        "config",
        "apply",
        `--database-path=${params.baseDir}`,
        `--data=${params.dataDir}`,
        `--extension=${params.extensionName}`,
      ],
    },
  ] as const

  for (const operation of operations) {
    let outcome: { readonly exitCode: number; readonly stdout: string; readonly stderr: string }
    try {
      outcome = await dependencies.runProcess(installation.ibcmdPath, operation.args, {
        cwd: params.dataDir,
      })
    } catch (caught) {
      throw new PlatformFixtureError(
        "platform_command_failed",
        `Не удалось запустить этап ${operation.step}; журнал: ${operation.logPath}`,
        { step: operation.step, logPath: operation.logPath }
      )
    }
    await dependencies.writeFile(
      operation.logPath,
      `stdout: ${outcome.stdout}\nstderr: ${outcome.stderr}\n`
    )
    if (outcome.exitCode !== 0) {
      throw new PlatformFixtureError(
        "platform_command_failed",
        `Этап ${operation.step} завершился с кодом ${outcome.exitCode}; журнал: ${operation.logPath}`,
        { step: operation.step, logPath: operation.logPath }
      )
    }
  }
}

const nodeDependencies: PlatformFixtureDependencies = {
  findPlatform,
  async mkdir(path) {
    await mkdir(path, { recursive: true })
  },
  async writeFile(path, content) {
    await writeFile(path, content, "utf8")
  },
  runProcess(command, args, options) {
    return new Promise((resolve, reject) => {
      let stdout = ""
      let stderr = ""
      const child = spawn(command, args, {
        cwd: options.cwd,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      })
      child.stdout.setEncoding("utf8")
      child.stderr.setEncoding("utf8")
      child.stdout.on("data", (chunk: string) => { stdout += chunk })
      child.stderr.on("data", (chunk: string) => { stderr += chunk })
      child.once("error", reject)
      child.once("exit", (code, signal) => {
        if (signal !== null) {
          reject(new Error(`Процесс остановлен сигналом ${signal}`))
          return
        }
        resolve({ exitCode: code ?? 1, stdout, stderr })
      })
    })
  },
}
