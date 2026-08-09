import { describe, expect, it } from "vitest"
import {
  bindDeferredObjectValues,
  finalizeDeferredObjectValues,
  type DeferredValuePath,
} from "./deferredObjectValues"

const path = (valuePath: readonly (string | number)[]): DeferredValuePath => ({
  valuePath,
  rulePath: [{ propertyKey: "value" }],
})

describe("deferred object values", () => {
  it.each([
    [{ Объект: { Значение: "old" } }, ["Объект", "Значение"]],
    [{ Массив: [{ Значение: "old" }] }, ["Массив", 0, "Значение"]],
    [{ Запись: { Ключ: { Значение: "old" } } }, ["Запись", "Ключ", "Значение"]],
  ] as const)("binds and replaces %j", (root, valuePath) => {
    const deferred = bindDeferredObjectValues(root, [path(valuePath)])
    const expectedOwner = valuePath.slice(0, -1).reduce<unknown>(
      (value, segment) => (value as Record<string | number, unknown>)[segment],
      root
    )

    expect(deferred[0]?.target.object).toBe(expectedOwner)
    finalizeDeferredObjectValues({
      root,
      deferred,
      finalize: ({ value }) => (value === "old" ? "new" : value),
    })
    expect(
      valuePath.reduce<unknown>(
        (value, segment) => (value as Record<string | number, unknown>)[segment],
        root
      )
    ).toBe("new")
  })

  it("rejects a missing target key", () => {
    expect(() => bindDeferredObjectValues({}, [path(["Нет", "Пути"])]))
      .toThrow(/valuePath=\/Нет\/Пути.*rulePath=\/value/)
  })

  it("rejects a stale object reference", () => {
    const root = { Узел: { Значение: "old" } }
    const deferred = bindDeferredObjectValues(root, [path(["Узел", "Значение"])])
    root.Узел = { Значение: "replacement" }

    expect(() =>
      finalizeDeferredObjectValues({ root, deferred, finalize: ({ value }) => value })
    ).toThrow("Связанная цель больше не принадлежит итоговому дереву")
  })
})
