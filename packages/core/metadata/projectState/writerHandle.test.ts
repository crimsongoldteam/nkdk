import { afterEach, describe, expect, it, vi } from "vitest"
import { createBinaryProjectStateTestFixture } from "./binary/testFixture"
import { createProjectStateFragmentWriter } from "./binary/fragment"
import { projectStateBinaryPath } from "./binary/persistence"
import { trackTempProjectDirs } from "./tests/tempProjectDir"
import {
  createProjectStateWriterHandle,
  ProjectStateWriterCancelledError,
  type ProjectStateWriterHandle,
} from "./writerHandle"

describe("владелец состояния проекта в главном процессе", () => {
  const handles: ProjectStateWriterHandle[] = []
  const projects = trackTempProjectDirs("nkdk-binary-writer-")

  afterEach(async () => {
    await Promise.all(handles.splice(0).map((handle) => handle.close().catch(() => undefined)))
    await projects.removeAll()
  })

  it("возвращает результат до окончания сохранения, но не начинает следующее изменение", async () => {
    const saving = Promise.withResolvers<void>()
    const events: string[] = []
    const handle = createHandle(async () => {
      events.push("save")
      await saving.promise
    })
    await handle.beginUpdate("/project")
    await handle.writeFragment(fragment("cf/a.bin", 1n))

    await expect(handle.commitAndScheduleCheckpoint()).resolves.toEqual({
      snapshotPath: projectStateBinaryPath("/project"),
    })
    const next = handle.beginUpdate("/project").then(() => events.push("next"))
    await Promise.resolve()
    expect(events).toEqual(["save"])

    saving.resolve()
    await next
    expect(events).toEqual(["save", "next"])
    await handle.rollbackUpdate()
  })

  it("повторяет неудачное сохранение перед следующим изменением", async () => {
    const save = vi.fn()
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce(undefined)
    const handle = createHandle(save)
    await handle.beginUpdate("/project")
    await handle.writeFragment(fragment("cf/a.bin", 1n))
    await handle.commitAndScheduleCheckpoint()

    await expect(handle.beginUpdate("/project")).resolves.toBeUndefined()
    expect(save).toHaveBeenCalledTimes(2)
    await handle.rollbackUpdate()
  })

  it("отбрасывает незавершённое изменение без сохранения", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const handle = createHandle(save)
    await handle.beginUpdate("/project")
    await handle.writeFragment(fragment("cf/a.bin", 1n))

    await handle.rollbackUpdate()

    expect(save).not.toHaveBeenCalled()
    await expect(handle.readComponentProjection("cf")).resolves.toMatchObject({ updates: [] })
  })

  it("не планирует сохранение для неизменившегося состояния", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const handle = createHandle(save)

    await handle.beginUpdate("/project")
    await handle.commitAndScheduleCheckpoint()
    await handle.flushCheckpoint()

    expect(save).not.toHaveBeenCalled()
  })

  it("передаёт двоичный фрагмент хранилищу и публикует его только при commit", async () => {
    const handle = createHandle(async () => undefined)
    const writer = createProjectStateFragmentWriter()
    writer.appendFile({
      kind: "resource", projectPath: "cf/a.bin", componentPath: "cf", resourceKind: "resource",
    }, 1n)
    await handle.beginUpdate("/project")

    await handle.writeFragment(writer.finish())
    await expect(handle.readFileBaselinePathPage(["cf/a.bin", "cf/missing.bin"]))
      .resolves.toMatchObject({ previousFileIds: Int32Array.of(-1, -1) })
    await expect(handle.readComponentProjection("cf")).resolves.toMatchObject({
      updates: [{ projectPath: "cf/a.bin" }],
    })

    await handle.rollbackUpdate()
    await expect(handle.readComponentProjection("cf")).resolves.toMatchObject({ updates: [] })
  })

  it("останавливает отменённое изменение до записи", async () => {
    const handle = createHandle(async () => undefined)
    const controller = new AbortController()
    await handle.beginUpdate("/project", controller.signal)
    controller.abort()

    await expect(handle.writeFragment(fragment("cf/a.bin", 1n)))
      .rejects.toBeInstanceOf(ProjectStateWriterCancelledError)
    await handle.rollbackUpdate()
  })

  it("загружает сохранённое состояние при новом открытии проекта", async () => {
    const projectDir = await projects.create()
    const first = createProjectStateWriterHandle()
    handles.push(first)
    await first.beginUpdate(projectDir)
    await first.writeFragment(fragment("cf/a.bin", 1n))
    await first.commitAndScheduleCheckpoint()
    await first.close()
    handles.splice(handles.indexOf(first), 1)

    const reopened = createProjectStateWriterHandle()
    handles.push(reopened)
    await reopened.openProject(projectDir)

    await expect(reopened.readComponentProjection("cf")).resolves.toMatchObject({
      updates: [{ projectPath: "cf/a.bin" }],
    })
  })

  function createHandle(save: NonNullable<Parameters<typeof createProjectStateWriterHandle>[0]>["save"]) {
    const handle = createProjectStateWriterHandle({
      openStore: async () => createBinaryProjectStateTestFixture().store,
      save,
    })
    handles.push(handle)
    return handle
  }
})

function fragment(projectPath: string, hash: bigint) {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile({ kind: "resource", projectPath, componentPath: "cf", resourceKind: "resource" }, hash)
  return writer.finish()
}
