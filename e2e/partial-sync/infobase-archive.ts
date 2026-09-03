import { spawn } from "node:child_process"
import { rename, rm, stat, writeFile } from "node:fs/promises"
import { findPlatform } from "@nkdk/platform"

export type ArchiveParams = {
  readonly baseDir: string
  readonly dataDir: string
  readonly archivePath: string
  readonly logPath: string
}

export type ArchiveTiming = {
  readonly elapsedMs: number
  readonly sizeBytes: number
  readonly requiresReconnect: true
}

type ProcessOutcome = {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export type InfobaseArchiveDependencies = {
  findPlatform(): Promise<{ readonly version: string; readonly ibcmdPath?: string } | undefined>
  runProcess(command: string, args: readonly string[]): Promise<ProcessOutcome>
  remove(path: string): Promise<void>
  move(source: string, destination: string): Promise<void>
  fileSize(path: string): Promise<number>
  writeFile(path: string, contents: string): Promise<void>
  now(): number
}

export type InfobaseArchiveStore = {
  dump(params: ArchiveParams): Promise<ArchiveTiming>
  restore(params: ArchiveParams): Promise<ArchiveTiming>
}

export function createInfobaseArchiveStore(
  closeConnection: () => Promise<void>,
  dependencies: InfobaseArchiveDependencies = nodeDependencies,
): InfobaseArchiveStore {
  return {
    async dump(params) {
      const ibcmd = await requireIbcmd(dependencies)
      const temporaryPath = `${params.archivePath}.tmp`
      await closeConnection()
      await dependencies.remove(temporaryPath)
      const startedAt = dependencies.now()
      const outcome = await dependencies.runProcess(ibcmd, [
        "infobase",
        "dump",
        `--database-path=${params.baseDir}`,
        `--data=${params.dataDir}`,
        temporaryPath,
      ])
      const elapsedMs = dependencies.now() - startedAt
      if (outcome.exitCode !== 0) {
        await dependencies.writeFile(params.logPath, formatLog(outcome))
        await dependencies.remove(temporaryPath)
        throw new Error(`Выгрузка информационной базы завершилась с кодом ${outcome.exitCode}; журнал: ${params.logPath}`)
      }
      const sizeBytes = await dependencies.fileSize(temporaryPath)
      if (sizeBytes <= 0) {
        await dependencies.remove(temporaryPath)
        throw new Error(`Выгрузка информационной базы создала пустой файл: ${temporaryPath}`)
      }
      await dependencies.move(temporaryPath, params.archivePath)
      await dependencies.writeFile(params.logPath, formatLog(outcome))
      return { elapsedMs, sizeBytes, requiresReconnect: true }
    },
    async restore(params) {
      const ibcmd = await requireIbcmd(dependencies)
      await closeConnection()
      const startedAt = dependencies.now()
      const outcome = await dependencies.runProcess(ibcmd, [
        "infobase",
        "restore",
        `--database-path=${params.baseDir}`,
        `--data=${params.dataDir}`,
        "--force",
        params.archivePath,
      ])
      const elapsedMs = dependencies.now() - startedAt
      await dependencies.writeFile(params.logPath, formatLog(outcome))
      if (outcome.exitCode !== 0) {
        throw new Error(`Восстановление информационной базы завершилось с кодом ${outcome.exitCode}; журнал: ${params.logPath}`)
      }
      return {
        elapsedMs,
        sizeBytes: await dependencies.fileSize(params.archivePath),
        requiresReconnect: true,
      }
    },
  }
}

async function requireIbcmd(dependencies: InfobaseArchiveDependencies): Promise<string> {
  const platform = await dependencies.findPlatform()
  if (platform === undefined || !platform.version.startsWith("8.3.27.")) {
    throw new Error("Не найдена поддерживаемая платформа версии 8.3.27")
  }
  if (platform.ibcmdPath === undefined) throw new Error("В установке платформы отсутствует ibcmd")
  return platform.ibcmdPath
}

function formatLog(outcome: ProcessOutcome): string {
  return `stdout: ${outcome.stdout}\nstderr: ${outcome.stderr}\n`
}

const nodeDependencies: InfobaseArchiveDependencies = {
  findPlatform,
  runProcess(command, args) {
    return new Promise((resolve, reject) => {
      let stdout = ""
      let stderr = ""
      const child = spawn(command, args, { shell: false, stdio: ["ignore", "pipe", "pipe"] })
      child.stdout.setEncoding("utf8")
      child.stderr.setEncoding("utf8")
      child.stdout.on("data", (chunk: string) => { stdout += chunk })
      child.stderr.on("data", (chunk: string) => { stderr += chunk })
      child.once("error", reject)
      child.once("exit", (code, signal) => {
        if (signal !== null) reject(new Error(`ibcmd остановлен сигналом ${signal}`))
        else resolve({ exitCode: code ?? 1, stdout, stderr })
      })
    })
  },
  async remove(path) { await rm(path, { force: true }) },
  move: rename,
  async fileSize(path) { return (await stat(path)).size },
  async writeFile(path, contents) { await writeFile(path, contents, "utf8") },
  now: Date.now,
}
