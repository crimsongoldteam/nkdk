import { describe, expect, it } from "vitest"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataInterfaceRules } from "./rules"
import { АдминистративныйYAML } from "./__fixtures__/Административный"
import { ОбновлениеКонфигурацииИБYAML } from "./__fixtures__/ОбновлениеКонфигурацииИБ"
import { ОбщийYAML } from "./__fixtures__/Общий"
import { ПолныйYAML } from "./__fixtures__/Полный"

describe("Interface XML round-trip", () => {
  it.each([
    ["Административный", АдминистративныйYAML], ["ОбновлениеКонфигурацииИБ", ОбновлениеКонфигурацииИБYAML],
    ["Общий", ОбщийYAML], ["Полный", ПолныйYAML],
  ] as const)("сохраняет исходный %s.xml", (name, yaml) => {
    const params = { rule: MetadataInterfaceRules, importMetaUrl: import.meta.url, fixture: `${name}.xml`, name }
    const imported = testAppliedObjectFromXMLToYAML(params)
    expect(imported.yaml).toEqual(yaml)
    const exported = testAppliedObjectFromYAMLToXML({ ...params, yaml: imported.yaml })
    expect(exported.result).toBe(exported.expected)
    expect(imported.yaml).not.toHaveProperty("uuid")
  })
})
