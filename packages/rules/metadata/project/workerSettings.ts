import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { assertWorkerCount, parseMetadataYamlData, resolveWorkerCount, type WorkerCountSource } from "@nkdk/runtime"

export async function readWorkerSettings(projectDir: string): Promise<{ workerCount?: number }> {
  let source: string
  try {
    source = await readFile(join(projectDir, ".nkdk", "project.yaml"), "utf8")
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return {}
    throw new Error("Не удалось прочитать настройки воркеров проекта")
  }
  let settings: unknown
  const parsed = parseMetadataYamlData(source)
  if (parsed.syntaxErrors.length > 0) throw new Error("Некорректный YAML настроек воркеров проекта")
  settings = parsed.data
  if (settings === null || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error("Настройки воркеров проекта должны быть объектом")
  }
  if (!("workerCount" in settings)) return {}
  assertWorkerCount(settings.workerCount)
  return { workerCount: settings.workerCount }
}

export async function withProjectWorkerCount<P extends { projectDir: string; concurrency?: number }>(
  params: P,
  automatic: () => number,
): Promise<P & { concurrency: number; workerCountSource: WorkerCountSource }> {
  const settings = await readWorkerSettings(params.projectDir)
  const selected = resolveWorkerCount({ concurrency: params.concurrency, ...settings, automatic })
  return { ...params, concurrency: selected.count, workerCountSource: selected.source }
}
