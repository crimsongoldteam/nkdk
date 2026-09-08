import { describe, expect, it } from "vitest"
import { preparedXMLDependencyFacts, withPreparedXMLDependencyFacts } from "./preparedXMLDependencies"

describe("prepared XML dependencies", () => {
  it("ограничивает факты вложенным вызовом, не изменяя YAML", () => {
    const yaml = { Значение: "текущее" }
    const descriptors = Object.getOwnPropertyDescriptors(yaml)
    const outer = { item: { Тип: "Строка" }, root: {} }
    const inner = { item: { Тип: "Булево" }, root: {} }
    expect(withPreparedXMLDependencyFacts(yaml, outer, () => {
      expect(preparedXMLDependencyFacts(yaml)).toBe(outer)
      expect(Object.hasOwn(yaml, "Тип")).toBe(false)
      withPreparedXMLDependencyFacts(yaml, inner, () => expect(preparedXMLDependencyFacts(yaml)).toBe(inner))
      expect(preparedXMLDependencyFacts(yaml)).toBe(outer)
      return "ok"
    })).toBe("ok")
    expect(preparedXMLDependencyFacts(yaml)).toBeUndefined()
    expect(Object.getOwnPropertyDescriptors(yaml)).toEqual(descriptors)
    expect(Reflect.ownKeys(yaml)).toEqual(["Значение"])
  })

  it("освобождает привязку при ошибке", () => {
    const yaml = {}
    expect(() => withPreparedXMLDependencyFacts(yaml, { item: {}, root: {} }, () => {
      throw new Error("failed conversion")
    })).toThrow("failed conversion")
    expect(preparedXMLDependencyFacts(yaml)).toBeUndefined()
  })
})
