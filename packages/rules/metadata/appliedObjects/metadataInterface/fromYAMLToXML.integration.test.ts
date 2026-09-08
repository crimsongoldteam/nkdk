import { describe, expect, it } from "vitest"
import { createDirectAdoptedExportContext, testMetadataItemFromYAMLToXML, testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML, testPropertyFromXMLToYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataConfigurationRules } from "../configuration/rules"
import { MetadataInterfaceRules } from "./rules"

describe("Interface YAML", () => {
  it("восстанавливает опущенный переключаемый только из YAML, без reference", () => {
    const rule = { itemType: "InterfaceSwitchableProbe", properties: {
      switchable: MetadataInterfaceRules.properties.switchable,
    } }
    expect(testPropertyFromYAMLToXML({ rule, yaml: {} }).xml).toEqual({ Properties: { Switchable: true } })
    expect(testPropertyFromYAMLToXML({ rule, yaml: { Переключаемый: "Ложь" } }).xml)
      .toEqual({ Properties: { Switchable: false } })
    expect(testPropertyFromXMLToYAML({ rule, xml: { Properties: {} } }).yaml).toEqual({})
  })
  it("восстанавливает принадлежность заимствованного интерфейса вне YAML", () => {
    const logicalAddress = "Интерфейс.Полный"
    const result = testMetadataItemFromYAMLToXML({ rule: MetadataInterfaceRules, yaml: {}, name: "Полный", context: createDirectAdoptedExportContext(logicalAddress) })
    expect(result.xml).toMatchObject({ MetaDataObject: { Interface: {
      Properties: { Name: "Полный", ObjectBelonging: "Adopted" },
    } } })
  })
  it.each([
    ["Полный", {}],
    ["Общий", { Переключаемый: "Ложь" }],
  ])("использует согласованный implicit для %s", (name, yaml) => {
    const params = { rule: MetadataInterfaceRules, importMetaUrl: import.meta.url, fixture: `${name}.xml`, name: String(name) }
    expect(testAppliedObjectFromXMLToYAML(params).yaml).toEqual(yaml)
    const exported = testAppliedObjectFromYAMLToXML({ ...params, yaml })
    expect(exported.result).toBe(exported.expected)
    expect(MetadataInterfaceRules.properties.switchable).not.toHaveProperty("defaultValueXML")
  })

  it.each(["Interface.Полный", ""])("сохраняет ОсновнойИнтерфейс %s", (value) => {
    const rule = { itemType: "ConfigurationInterfaceProbe", properties: { defaultInterface: MetadataConfigurationRules.properties.defaultInterface } }
    const source = { Properties: { DefaultInterface: value } }
    const imported = testPropertyFromXMLToYAML({ rule, xml: source })
    if (value !== "") expect(imported.yaml).toEqual({ ОсновнойИнтерфейс: "Полный" })
    expect(testPropertyFromYAMLToXML({ rule, yaml: imported.yaml }).xml).toEqual(source)
  })
})
