import { spawn } from "node:child_process"
import { mkdir } from "node:fs/promises"
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
  runProcess(
    command: string,
    args: readonly string[],
    options: { readonly cwd: string }
  ): Promise<{ readonly exitCode: number }>
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
  if (installation.enterprisePath === undefined) {
    throw new PlatformFixtureError(
      "platform_component_missing",
      "В установке платформы отсутствует исполняемый файл предприятия"
    )
  }

  await dependencies.mkdir(params.dataDir)
  await dependencies.mkdir(params.logsDir)
  const connectionString = `File="${params.baseDir}";`
  const operations = [
    {
      step: "create-base",
      logPath: join(params.logsDir, "01-create-base.log"),
      args: ["CREATEINFOBASE", connectionString],
    },
    {
      step: "load-configuration",
      logPath: join(params.logsDir, "02-load-configuration.log"),
      args: ["DESIGNER", `/F${params.baseDir}`, "/LoadConfigFromFiles", params.cfXmlDir, "/UpdateDBCfg"],
    },
    {
      step: "load-extension",
      logPath: join(params.logsDir, "03-load-extension.log"),
      args: [
        "DESIGNER",
        `/F${params.baseDir}`,
        "/LoadConfigFromFiles",
        params.extensionXmlDir,
        "-Extension",
        params.extensionName,
        "/UpdateDBCfg",
      ],
    },
  ] as const

  for (const operation of operations) {
    const args = [...operation.args, "/DisableStartupMessages", "/Out", operation.logPath]
    let outcome: { readonly exitCode: number }
    try {
      outcome = await dependencies.runProcess(installation.enterprisePath, args, {
        cwd: params.dataDir,
      })
    } catch (caught) {
      throw new PlatformFixtureError(
        "platform_command_failed",
        `Не удалось запустить этап ${operation.step}; журнал: ${operation.logPath}`,
        { step: operation.step, logPath: operation.logPath }
      )
    }
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
  runProcess(command, args, options) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        shell: false,
        stdio: "ignore",
      })
      child.once("error", reject)
      child.once("exit", (code, signal) => {
        if (signal !== null) {
          reject(new Error(`Процесс остановлен сигналом ${signal}`))
          return
        }
        resolve({ exitCode: code ?? 1 })
      })
    })
  },
}
