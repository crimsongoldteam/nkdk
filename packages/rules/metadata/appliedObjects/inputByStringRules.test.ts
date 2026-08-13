import { parseMetadataYaml } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { inputByStringFieldsRule } from "../commonObjects/inputByStringFields/types"
import { numberRule } from "../commonObjects/number/types"
import { systemEnumerationRule } from "../systemEnumerations/types"
import { createAppliedObjectValidator, createInputByStringFinalizer } from "./inputByStringRules"

const catalogRule = {
  itemType: "InputByStringCatalogTest",
  properties: {
    codeLength: numberRule({
      yaml: "ДлинаКода",
      implicitValueYAML: 9,
      maximumWhen: { propertyKey: "codeType", equals: "Number", maximum: 38 },
    }),
    descriptionLength: numberRule({ yaml: "ДлинаНаименования", implicitValueYAML: 25 }),
    codeType: systemEnumerationRule({
      yaml: "ТипКода",
      typeSE: "CatalogCodeType",
      implicitValueYAML: "String",
    }),
    inputByString: inputByStringFieldsRule({
      yaml: "ВводПоСтроке",
      standardFields: [
        standardField("Наименование", "descriptionLength", "ДлинаНаименования", 25),
        standardField("Код", "codeLength", "ДлинаКода", 9),
      ],
    }),
  },
} as unknown as MetadataItemRule

const documentRule = {
  itemType: "InputByStringDocumentTest",
  properties: {
    numberLength: numberRule({
      yaml: "ДлинаНомера",
      implicitValueYAML: 9,
      maximumWhen: { propertyKey: "numberType", equals: "Number", maximum: 38 },
    }),
    numberType: systemEnumerationRule({
      yaml: "ТипНомера",
      typeSE: "DocumentNumberType",
      implicitValueYAML: "String",
    }),
    inputByString: inputByStringFieldsRule({
      yaml: "ВводПоСтроке",
      standardFields: [
        standardField("Номер", "numberLength", "ДлинаНомера", 9),
      ],
    }),
  },
} as unknown as MetadataItemRule

describe("createInputByStringFinalizer", () => {
  const finalizer = createInputByStringFinalizer(catalogRule)

  it.each([
    [
      { ВводПоСтроке: ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"] },
      {},
    ],
    [
      { ДлинаКода: 0, ВводПоСтроке: ["СтандартныйРеквизит.Наименование"] },
      { ДлинаКода: 0 },
    ],
    [
      { ДлинаКода: 0, ДлинаНаименования: 0, ВводПоСтроке: [] },
      { ДлинаКода: 0, ДлинаНаименования: 0 },
    ],
  ])("removes only the computed ordered value", (yaml, expected) => {
    expect(finalizer.requiresFinalization(yaml, catalogRule)).toBe(true)
    finalizer.finalize({ yaml, rule: catalogRule, ownerMetadataCache: {} as never })
    expect(yaml).toEqual(expected)
  })

  it.each([
    [["СтандартныйРеквизит.Код", "СтандартныйРеквизит.Наименование"]],
    [["СтандартныйРеквизит.Наименование"]],
    [["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код", "Реквизит.Артикул"]],
  ])("preserves a meaningful explicit list", (value) => {
    const yaml = { ВводПоСтроке: value }
    finalizer.finalize({ yaml, rule: catalogRule, ownerMetadataCache: {} as never })
    expect(yaml).toHaveProperty("ВводПоСтроке", value)
  })
})

describe("createAppliedObjectValidator", () => {
  it("forbids an explicit computed list but allows reversed order", () => {
    expect(messages(catalogRule, {
      ВводПоСтроке: ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"],
    })).toContain("ВводПоСтроке совпадает с вычисляемым значением и не должен задаваться явно")

    expect(messages(catalogRule, {
      ВводПоСтроке: ["СтандартныйРеквизит.Код", "СтандартныйРеквизит.Наименование"],
    })).not.toContain("ВводПоСтроке совпадает с вычисляемым значением и не должен задаваться явно")
  })

  it.each([
    [catalogRule, { ДлинаКода: 0, ВводПоСтроке: ["СтандартныйРеквизит.Код"] },
      "СтандартныйРеквизит.Код недоступен при ДлинаКода: 0"],
    [catalogRule, { ДлинаНаименования: 0, ВводПоСтроке: ["СтандартныйРеквизит.Наименование"] },
      "СтандартныйРеквизит.Наименование недоступен при ДлинаНаименования: 0"],
    [documentRule, { ДлинаНомера: 0, ВводПоСтроке: ["СтандартныйРеквизит.Номер"] },
      "СтандартныйРеквизит.Номер недоступен при ДлинаНомера: 0"],
  ])("forbids a disabled standard field", (rule, yaml, expected) => {
    expect(messages(rule, yaml)).toContain(expected)
  })

  it("allows an additional suitable attribute when standard fields are disabled", () => {
    expect(messages(catalogRule, {
      ДлинаКода: 0,
      ДлинаНаименования: 0,
      ВводПоСтроке: ["Реквизит.Артикул"],
    })).toEqual([])
  })

  it.each([
    [documentRule, { ТипНомера: "Число", ДлинаНомера: 38 }, undefined],
    [documentRule, { ТипНомера: "Число", ДлинаНомера: 39 }, "ДлинаНомера не должна превышать 38 при ТипНомера: Число"],
    [documentRule, { ТипНомера: "Строка", ДлинаНомера: 50 }, undefined],
    [catalogRule, { ТипКода: "Число", ДлинаКода: 39 }, "ДлинаКода не должна превышать 38 при ТипКода: Число"],
  ])("checks a declared conditional maximum", (rule, yaml, expected) => {
    const actual = messages(rule, yaml)
    if (expected === undefined) expect(actual).toEqual([])
    else expect(actual).toContain(expected)
  })
})

function messages(rule: MetadataItemRule, yaml: Record<string, unknown>): string[] {
  const parsed = parseMetadataYaml(JSON.stringify(yaml))
  return createAppliedObjectValidator(rule)({
    filePath: "/project/Свойства.yaml",
    parsed,
    value: yaml,
    yamlPath: [],
    owner: { dir: "Справочник", name: "Тест" },
  }).map(({ message }) => message)
}

function standardField(
  name: string,
  propertyKey: string,
  lengthYAML: string,
  implicitValue: number
) {
  return {
    yaml: `СтандартныйРеквизит.${name}`,
    length: { propertyKey, yaml: lengthYAML, implicitValue },
  }
}
