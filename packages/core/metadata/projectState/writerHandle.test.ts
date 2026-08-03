import { afterEach, describe, expect, it, vi } from "vitest"
import { createBinaryProjectStateTestFixture } from "./binary/testFixture"
import { encodeProjectStateFileUpdateBatch } from "./binary/contribution"
import { createProjectStateFileUpdateBatch } from "./fileUpdate"
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
    await handle.writeBatch(batch("cf/a.bin", 1n))

    await expect(handle.commitAndScheduleCheckpoint()).resolves.toEqual({
      snapshotPath: "/project/.nkdk/cache/project-state.bin",
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
    await handle.writeBatch(batch("cf/a.bin", 1n))
    await handle.commitAndScheduleCheckpoint()

    await expect(handle.beginUpdate("/project")).resolves.toBeUndefined()
    expect(save).toHaveBeenCalledTimes(2)
    await handle.rollbackUpdate()
  })

  it("отбрасывает незавершённое изменение без сохранения", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const handle = createHandle(save)
    await handle.beginUpdate("/project")
    await handle.writeBatch(batch("cf/a.bin", 1n))

    await handle.rollbackUpdate()

    expect(save).not.toHaveBeenCalled()
    await expect(handle.readComponentProjection("cf")).resolves.toMatchObject({ updates: [] })
  })

  it("останавливает отменённое изменение до записи", async () => {
    const handle = createHandle(async () => undefined)
    const controller = new AbortController()
    await handle.beginUpdate("/project", controller.signal)
    controller.abort()

    await expect(handle.writeBatch(batch("cf/a.bin", 1n)))
      .rejects.toBeInstanceOf(ProjectStateWriterCancelledError)
    await handle.rollbackUpdate()
  })

  it("загружает сохранённое состояние при новом открытии проекта", async () => {
    const projectDir = await projects.create()
    const first = createProjectStateWriterHandle()
    handles.push(first)
    await first.beginUpdate(projectDir)
    await first.writeBatch(batch("cf/a.bin", 1n))
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

function batch(projectPath: string, hash: bigint) {
  return encodeProjectStateFileUpdateBatch(createProjectStateFileUpdateBatch([{
    update: { kind: "resource", projectPath, componentPath: "cf", resourceKind: "resource" },
    hash,
  }]))
}
