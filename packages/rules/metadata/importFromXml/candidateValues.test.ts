import { describe, expect, it } from "vitest"
import { ImportCandidateValues } from "./candidateValues"

describe("ImportCandidateValues", () => {
  it("разделяет тип элемента, ключ свойства и типы сегментов пути", () => {
    const values = new ImportCandidateValues<{ value: string }>()
    const base = { itemType: "Attribute", itemYamlPath: ["Items", 0], propertyKey: "value" }
    const candidates = [base,
      { ...base, itemType: "Other" },
      { ...base, itemYamlPath: ["Items", "0"] },
      { ...base, propertyKey: "other" },
    ]
    const expected = candidates.map((candidate, index) => {
      const result = { value: String(index) }
      values.set(candidate, result)
      return result
    })
    expect(values.size).toBe(4)
    expect(candidates.map(candidate => values.get(candidate))).toEqual(expected)
    expect(new Set(values.values())).toEqual(new Set(expected))
  })

  it("не смешивает логический адрес с сериализованным путём", () => {
    const values = new ImportCandidateValues<{ value: string }>()
    const base = { itemType: "Attribute", itemYamlPath: ["Items", 0], propertyKey: "value" }
    const pathValue = { value: "path" }, logicalValue = { value: "logical" }, emptyValue = { value: "empty" }
    values.set(base, pathValue)
    values.set({ ...base, logicalAddress: "/Items/0:value" }, logicalValue)
    values.set({ ...base, logicalAddress: "" }, emptyValue)
    expect(values.get(base)).toBe(pathValue)
    expect(values.get({ ...base, itemYamlPath: [], logicalAddress: "/Items/0:value" })).toBe(logicalValue)
    expect(values.get({ ...base, logicalAddress: "" })).toBe(emptyValue)
    expect(values.size).toBe(3)
  })

  it("не удерживает входной массив и заменяет значение без роста индекса", () => {
    const values = new ImportCandidateValues<{ value: string }>()
    const path = ["Items", "First"]
    const candidate = { itemType: "Attribute", itemYamlPath: path, propertyKey: "value" }
    values.set(candidate, { value: "old" })
    const replacement = { value: "new" }
    values.set(candidate, replacement)
    path[1] = "Second"
    expect(values.get(candidate)).toBeUndefined()
    expect(values.get({ ...candidate, itemYamlPath: ["Items", "First"] })).toBe(replacement)
    expect(values.size).toBe(1)
  })
})
