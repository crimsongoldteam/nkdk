import { expect, it } from "vitest"
import { resolveWorkerCount } from "./workerCount"

it("выбирает явное значение, настройку проекта, затем автоматическое", () => {
  let calls = 0
  const automatic = () => { calls++; return 3 }
  expect(resolveWorkerCount({ concurrency: 2, workerCount: 6, automatic })).toEqual({ count: 2, source: "operation" })
  expect(resolveWorkerCount({ workerCount: 6, automatic })).toEqual({ count: 6, source: "project" })
  expect(calls).toBe(0)
  expect(resolveWorkerCount({ automatic })).toEqual({ count: 3, source: "automatic" })
  expect(calls).toBe(1)
})

it.each([0, -1, 1.5, "6", null, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  "отвергает неверное значение %s даже при явном переопределении",
  value => {
    const automatic = () => 3
    expect(() => resolveWorkerCount({ workerCount: value as number, concurrency: 2, automatic })).toThrow()
    expect(() => resolveWorkerCount({ concurrency: value as number, automatic })).toThrow()
  },
)
