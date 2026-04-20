import { describe, expect, it } from "vitest"
import { runBatch, type BatchTask } from "./runBatch"

function makeTask<T>(overrides: Partial<BatchTask<T>> & { run: () => Promise<T> }): BatchTask<T> {
  return {
    kind: "catalog",
    name: "Test",
    ...overrides,
  }
}

describe("runBatch", () => {
  it("возвращает пустой результат для пустого списка задач", async () => {
    const result = await runBatch([], { concurrency: 4 })
    expect(result.succeeded).toBe(0)
    expect(result.failed).toEqual([])
    expect(result.results).toEqual([])
  })

  it("все задачи успешны — succeeded = количество задач, failed пуст", async () => {
    const tasks = [
      makeTask({ name: "A", run: async () => 1 }),
      makeTask({ name: "B", run: async () => 2 }),
      makeTask({ name: "C", run: async () => 3 }),
    ]
    const result = await runBatch(tasks, { concurrency: 4 })
    expect(result.succeeded).toBe(3)
    expect(result.failed).toHaveLength(0)
    expect(result.results).toEqual([1, 2, 3])
  })

  it("все задачи падают — succeeded = 0, failed содержит все ошибки", async () => {
    const tasks = [
      makeTask({ name: "A", run: async () => { throw new Error("err A") } }),
      makeTask({ name: "B", run: async () => { throw new Error("err B") } }),
    ]
    const result = await runBatch(tasks, { concurrency: 4 })
    expect(result.succeeded).toBe(0)
    expect(result.failed).toHaveLength(2)
    expect(result.results).toEqual([])
    expect(result.failed[0]!.error.message).toBe("err A")
    expect(result.failed[1]!.error.message).toBe("err B")
  })

  it("смешанный исход — правильно разделяет succeeded и failed", async () => {
    const tasks = [
      makeTask({ name: "ok", run: async () => "success" }),
      makeTask({ name: "bad", run: async () => { throw new Error("boom") } }),
      makeTask({ name: "ok2", run: async () => "also success" }),
    ]
    const result = await runBatch(tasks, { concurrency: 4 })
    expect(result.succeeded).toBe(2)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]!.name).toBe("bad")
    expect(result.failed[0]!.error.message).toBe("boom")
    expect(result.results).toEqual(["success", "also success"])
  })

  it("сохраняет метаданные задачи в BatchFailure", async () => {
    const task = makeTask({
      kind: "form",
      name: "ФормаВыбора",
      parent: "Контрагенты",
      sourcePath: "path/to/form.xml",
      run: async () => { throw new Error("parse error") },
    })
    const result = await runBatch([task], { concurrency: 1 })
    const failure = result.failed[0]!
    expect(failure.kind).toBe("form")
    expect(failure.name).toBe("ФормаВыбора")
    expect(failure.parent).toBe("Контрагенты")
    expect(failure.sourcePath).toBe("path/to/form.xml")
    expect(failure.error.message).toBe("parse error")
  })

  it("приводит не-Error значения к Error", async () => {
    const tasks = [
      makeTask({ name: "str", run: async () => { throw "строковая ошибка" } }),
      makeTask({ name: "num", run: async () => { throw 42 } }),
      makeTask({ name: "obj", run: async () => { throw { code: "ENOENT" } } }),
    ]
    const result = await runBatch(tasks, { concurrency: 4 })
    expect(result.failed).toHaveLength(3)
    for (const f of result.failed) {
      expect(f.error).toBeInstanceOf(Error)
    }
    expect(result.failed[0]!.error.message).toBe("строковая ошибка")
    expect(result.failed[1]!.error.message).toBe("42")
  })

  it("не превышает лимит concurrency", async () => {
    const concurrency = 3
    let running = 0
    let maxRunning = 0

    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({
        name: `task-${i}`,
        run: async () => {
          running++
          maxRunning = Math.max(maxRunning, running)
          await new Promise((resolve) => setTimeout(resolve, 5))
          running--
          return i
        },
      }),
    )

    await runBatch(tasks, { concurrency })
    expect(maxRunning).toBeLessThanOrEqual(concurrency)
  })
})
