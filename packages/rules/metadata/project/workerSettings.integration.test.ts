import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, it, vi } from "vitest"
import { readWorkerSettings, withProjectWorkerCount } from "./workerSettings"
import { createMetadataRuntime } from "../runtime/createMetadataRuntime"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { createProjectStateService } from "../projectState/service"

it("читает размер пула без infobase и не раскрывает чужие настройки", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-worker-settings-"))
  try {
    expect(await readWorkerSettings(projectDir)).toEqual({})
    await mkdir(join(projectDir, ".nkdk"))
    const file = join(projectDir, ".nkdk", "project.yaml")
    await writeFile(file, "workerCount: 6\n")
    expect(await readWorkerSettings(projectDir)).toEqual({ workerCount: 6 })
    await writeFile(file, "infobase:\n  password: private-value\n")
    expect(await readWorkerSettings(projectDir)).toEqual({})
    await writeFile(file, "workerCount: private-value\n")
    await expect(readWorkerSettings(projectDir)).rejects.not.toThrow("private-value")
    await writeFile(file, "workerCount: [private-value\n")
    await expect(readWorkerSettings(projectDir)).rejects.not.toThrow("private-value")
  } finally {
    await rm(projectDir, { recursive: true, force: true })
  }
})

it("передаёт выбранные шесть воркеров из runtime в проверку проекта", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-runtime-workers-"))
  const worker = new URL("file:///unused-worker.js")
  const runtime = createMetadataRuntime({
    rules: emptyMetadataRules,
    workers: { preparedYamlProject: worker, importFromXml: worker, fullSyncToXml: worker, generic: worker },
    createProjectStateService,
  })
  const projectState = runtime.projects.createState()
  const refresh = vi.spyOn(projectState, "refreshAndValidate").mockRejectedValue(new Error("pool boundary"))
  try {
    await mkdir(join(projectDir, ".nkdk"))
    await writeFile(join(projectDir, ".nkdk", "project.yaml"), "workerCount: 6\n")
    await mkdir(join(projectDir, "cf", "Язык"), { recursive: true })
    await writeFile(join(projectDir, "cf", "Конфигурация.yaml"), "ОсновнойЯзык: Язык.Русский\n")
    await writeFile(join(projectDir, "cf", "Язык", "Русский.yaml"), "КодЯзыка: ru\n")
    await expect(runtime.validation.validateProject({ projectDir, projectState })).rejects.toThrow("pool boundary")
    expect(refresh.mock.calls[0]?.[0].concurrency).toBe(6)
    await expect(runtime.validation.validateProject({ projectDir, projectState, concurrency: 2 })).rejects.toThrow("pool boundary")
    expect(refresh.mock.calls[1]?.[0].concurrency).toBe(2)
    expect(await withProjectWorkerCount({ projectDir }, () => 3))
      .toEqual({ projectDir, concurrency: 6, workerCountSource: "project" })
    await writeFile(join(projectDir, ".nkdk", "project.yaml"), "workerCount: 0\n")
    await expect(runtime.validation.validateProject({ projectDir, projectState, concurrency: 2 })).rejects.toThrow("workerCount")
    expect(refresh).toHaveBeenCalledTimes(2)
  } finally {
    await runtime.close()
    await rm(projectDir, { recursive: true, force: true })
  }
})
