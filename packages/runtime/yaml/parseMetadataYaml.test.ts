import { describe, expect, it } from "vitest"
import { createXmlAnomalyAnnotations } from "./xmlAnomalyAnnotations"
import { parsedYamlFromKnownData, parseMetadataYamlData } from "./parseMetadataYaml"

describe("parseMetadataYamlData", () => {
  it.each(["", " \n\t"])("читает пустой корневой документ как пустой объект", (text) => {
    const parsed = parseMetadataYamlData(text)

    expect(parsed.data).toEqual({})
    expect(parsed.syntaxErrors).toEqual([])
    expect([...parsed.annotations.entries()]).toEqual([])
  })

  it.each([
    ["null", null],
    ["~", "~"],
  ])("сохраняет явное значение %s", (text, data) => {
    const parsed = parseMetadataYamlData(text)

    expect(parsed.data).toEqual(data)
    expect(parsed.syntaxErrors).toEqual([])
    expect([...parsed.annotations.entries()]).toEqual([])
  })

  it("возвращает XML-аннотации без индекса координат", () => {
    const parsed = parseMetadataYamlData("Значение: !xml/raw Текст")

    expect(parsed.annotations.at(parsed.data as object, "Значение")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
    })
  })
})

describe("parsedYamlFromKnownData", () => {
  it("сохраняет известный объект и строит точные координаты ключей по тексту", () => {
    const text = ["Внешний:", "  Внутренний:", "    Значение: 42"].join("\n")
    const yaml = Object.freeze({ Внешний: Object.freeze({ Внутренний: Object.freeze({ Значение: 42 }) }) })

    const parsed = parsedYamlFromKnownData(text, yaml)

    expect(parsed.data).toBe(yaml)
    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.locations.keyPosition(["Внешний", "Внутренний"])).toEqual({ line: 2, col: 3 })
    expect(parsed.locations.keyPosition(["Внешний", "Внутренний", "Значение"])).toEqual({ line: 3, col: 5 })
  })

  it("сохраняет переданные XML-аннотации известного объекта", () => {
    const yaml = { Тип: { "v8:TypeSet": "cfg:AnyRef" } }
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(yaml, "Тип", { kind: "raw", occurrence: 1, target: "value" })

    const parsed = parsedYamlFromKnownData("Тип: !xml/raw {}", yaml, annotations)

    expect(parsed.annotations.at(yaml, "Тип")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
    })
  })
})
