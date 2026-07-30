import { describe, expect, it } from "vitest"
import { mergeOmittedNames, readOmittedNames, readOmittedTypedNames } from "./omittedChildren"

describe("mergeOmittedNames", () => {
  it("сохраняет порядок существующих имён и добавляет новые в текущем порядке", () => {
    expect(
      mergeOmittedNames(["Новая", "Б", "А"], {
        kind: "names",
        names: ["А", "Удалена", "Б"],
      })
    ).toEqual(["А", "Б", "Новая"])
  })

  it("возвращает текущий порядок без сохранённого списка", () => {
    expect(mergeOmittedNames(["Б", "А"], undefined)).toEqual(["Б", "А"])
  })

  it("отклоняет дубли в текущем списке", () => {
    expect(() => mergeOmittedNames(["А", "А"], undefined)).toThrow("Дублирующееся имя А")
  })

  it("отклоняет дубли в сохранённом списке", () => {
    expect(() =>
      mergeOmittedNames(["А"], {
        kind: "names",
        names: ["А", "А"],
      })
    ).toThrow("Дублирующееся имя А")
  })
})

describe("readOmittedNames", () => {
  it("читает names и пропускает отсутствие значения", () => {
    expect(readOmittedNames({ kind: "names", names: ["Форма"] }, "ChildFormNames")).toEqual(["Форма"])
    expect(readOmittedNames(undefined, "ChildFormNames")).toBeUndefined()
  })

  it("отклоняет typedNames", () => {
    expect(() => readOmittedNames({ kind: "typedNames", items: [] }, "ChildFormNames")).toThrow(
      "ChildFormNames ожидает omittedChildren.kind = names"
    )
  })
})

describe("readOmittedTypedNames", () => {
  it("читает typedNames и пропускает отсутствие значения", () => {
    const items = [{ xmlName: "Catalog", name: "Товары" }]

    expect(readOmittedTypedNames({ kind: "typedNames", items }, "ConfigurationChildObjects")).toEqual(items)
    expect(readOmittedTypedNames(undefined, "ConfigurationChildObjects")).toBeUndefined()
  })

  it("отклоняет names", () => {
    expect(() => readOmittedTypedNames({ kind: "names", names: [] }, "ConfigurationChildObjects")).toThrow(
      "ConfigurationChildObjects ожидает omittedChildren.kind = typedNames"
    )
  })
})
