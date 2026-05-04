import { describe, expect, it } from "vitest"
import {
  getKindByYaml,
  getKnownKinds,
  getYamlByKind,
  isOwning,
  registerEdgeKind,
} from "./edgeKinds"

describe("edgeKinds — isOwning", () => {
  describe("owning kinds → true", () => {
    it.each([
      "ATTRIBUTE",
      "TABULAR_SECTION",
      "STANDARD_ATTRIBUTE",
      "CHOICE_PARAMETER",
      "CHOICE_PARAMETER_LINK",
      "ENUM_VALUE",
      "METADATA_CATALOG",
      "METADATA_DOCUMENT",
      "METADATA_ENUMERATION",
      "PARENT",
    ])("%s → true", (kind) => {
      expect(isOwning(kind)).toBe(true)
    })
  })

  describe("reference kinds → false", () => {
    it.each(["TYPE", "OBJECT", "FIELD", "VALUE"])("%s → false", (kind) => {
      expect(isOwning(kind)).toBe(false)
    })
  })

  it("бросает для неизвестного kind", () => {
    expect(() => isOwning("UNKNOWN_KIND")).toThrow(/неизвестный kind/)
  })
})

describe("registerEdgeKind", () => {
  it("регистрирует новый owning-вид", () => {
    registerEdgeKind("TEST_OBJECT", { yaml: "ТестОбъект", owning: true })
    expect(isOwning("TEST_OBJECT")).toBe(true)
    expect(getYamlByKind("TEST_OBJECT")).toBe("ТестОбъект")
    expect(getKindByYaml("ТестОбъект")).toBe("TEST_OBJECT")
  })

  it("регистрирует новый reference-вид", () => {
    registerEdgeKind("TEST_REFERENCE", { yaml: "ТестСсылка", owning: false })
    expect(isOwning("TEST_REFERENCE")).toBe(false)
  })
})

describe("yaml ↔ kind перевод", () => {
  it.each([
    ["Реквизит", "ATTRIBUTE"],
    ["Тип", "TYPE"],
    ["ДополнительнаяКолонка", "ADDITIONAL_COLUMN"],
    ["ПутьКДанным", "DATA_PATH"],
  ])("getKindByYaml(%s) = %s", (yaml, kind) => {
    expect(getKindByYaml(yaml)).toBe(kind)
  })

  it("getKindByYaml для неизвестного yaml → undefined", () => {
    expect(getKindByYaml("Несуществующее")).toBeUndefined()
  })

  it("не регистрирует legacy dataPath kind по имени свойства", () => {
    expect(getKnownKinds()).not.toContain("FOOTER_DATA_PATH")
    expect(getKnownKinds()).not.toContain("TITLE_DATA_PATH")
    expect(getKnownKinds()).not.toContain("ROW_PICTURE_DATA_PATH")
    expect(getKindByYaml("ПутьКДаннымПодвала")).toBeUndefined()
    expect(getKindByYaml("ПутьКДаннымЗаголовка")).toBeUndefined()
    expect(getKindByYaml("ПутьКДаннымКартинкиСтроки")).toBeUndefined()
  })

  it("переводит owning-виды параметров выбора", () => {
    expect(getKnownKinds()).toContain("CHOICE_PARAMETER")
    expect(getKnownKinds()).toContain("CHOICE_PARAMETER_LINK")
    expect(isOwning("CHOICE_PARAMETER")).toBe(true)
    expect(isOwning("CHOICE_PARAMETER_LINK")).toBe(true)
    expect(getYamlByKind("CHOICE_PARAMETER")).toBe("ПараметрВыбора")
    expect(getYamlByKind("CHOICE_PARAMETER_LINK")).toBe("СвязьПараметровВыбора")
  })
})

describe("ASCII-инвариант: все kinds — валидные Cypher identifiers", () => {
  it("каждый зарегистрированный kind соответствует ^[A-Z][A-Z0-9_]*$", () => {
    for (const kind of getKnownKinds()) {
      expect(kind).toMatch(/^[A-Z][A-Z0-9_]*$/)
    }
  })
})
