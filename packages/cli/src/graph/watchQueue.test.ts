import { afterEach, describe, expect, it, vi } from "vitest"
import { createWatchQueue } from "./watchQueue"

describe("createWatchQueue", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("схлопывает повторы и выполняет задачи последовательно", async () => {
    vi.useFakeTimers()
    const calls: string[][] = []
    const queue = createWatchQueue({
      debounceMs: 50,
      runTask: async (filePaths) => {
        calls.push(filePaths)
      },
    })

    queue.enqueue("a.yaml")
    queue.enqueue("a.yaml")
    queue.enqueue("b.yaml")

    await vi.advanceTimersByTimeAsync(60)
    await vi.runAllTimersAsync()

    expect(calls).toEqual([["a.yaml", "b.yaml"]])
  })

  it("не запускает следующую задачу, пока текущая не завершилась", async () => {
    vi.useFakeTimers()
    const started: string[] = []
    const finished: string[] = []
    let finishA: (() => void) | undefined
    const queue = createWatchQueue({
      debounceMs: 50,
      runTask: async (filePaths) => {
        started.push(filePaths.join(","))
        if (filePaths.includes("a.yaml")) {
          await new Promise<void>((resolve) => {
            finishA = resolve
          })
        }
        finished.push(filePaths.join(","))
      },
    })

    queue.enqueue("a.yaml")
    await vi.advanceTimersByTimeAsync(60)

    expect(started).toEqual(["a.yaml"])
    expect(finished).toEqual([])

    queue.enqueue("b.yaml")
    await vi.advanceTimersByTimeAsync(60)

    expect(started).toEqual(["a.yaml"])
    expect(finished).toEqual([])

    finishA?.()
    await queue.drain()

    expect(started).toEqual(["a.yaml", "b.yaml"])
    expect(finished).toEqual(["a.yaml", "b.yaml"])
  })

  it("схлопывает повторы из enqueueMany в один batch", async () => {
    vi.useFakeTimers()
    const calls: string[][] = []
    const queue = createWatchQueue({
      debounceMs: 50,
      runTask: async (filePaths) => {
        calls.push(filePaths)
      },
    })

    queue.enqueueMany(["a.yaml", "a.yaml", "b.yaml"])

    await vi.advanceTimersByTimeAsync(60)
    await vi.runAllTimersAsync()

    expect(calls).toEqual([["a.yaml", "b.yaml"]])
  })

  it("продолжает работу после ошибки задачи", async () => {
    vi.useFakeTimers()
    const calls: string[] = []
    const errors: string[] = []
    const queue = createWatchQueue({
      debounceMs: 50,
      runTask: async (filePaths) => {
        calls.push(filePaths.join(","))
        if (filePaths.includes("a.yaml")) throw new Error("boom")
      },
      onError: (filePaths) => {
        errors.push(filePaths.join(","))
      },
    })

    queue.enqueue("a.yaml")
    queue.enqueue("b.yaml")
    await vi.advanceTimersByTimeAsync(60)
    await queue.drain()

    queue.enqueue("c.yaml")
    await vi.advanceTimersByTimeAsync(60)
    await queue.drain()

    expect(calls).toEqual(["a.yaml,b.yaml", "c.yaml"])
    expect(errors).toEqual(["a.yaml,b.yaml"])
  })
})
