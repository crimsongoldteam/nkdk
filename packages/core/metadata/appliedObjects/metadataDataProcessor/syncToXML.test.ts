import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { getTypeRule, type MetadataItemRule } from "../../orchestration"
import { MetadataDataProcessorRules } from "./rules"
import { canonicalSnapshot13XML } from "../../../tests/canonicalXML"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDataProcessor", () => {
  it("не дублирует корневой cfg namespace в типе реквизита без reference XML", () => {
    const attributes = getTypeRule(MetadataDataProcessorRules.properties.attributes.type, "yamlToXMLNestedRule")
    if (attributes?.kind !== "collection") throw new Error("Не зарегистрировано правило реквизитов обработки")
    const attributeRule =
      attributes.itemRuleFromProperty?.(MetadataDataProcessorRules.properties.attributes) ?? attributes.itemRule
    const typeRule = attributeRule.properties.type
    const rule = {
      itemType: "DataProcessorAttributeTypeProbe",
      properties: { type: typeRule },
    } as const satisfies MetadataItemRule
    const contexts = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      rule,
      context: contexts.importContext,
      xml: { Properties: { Type: { "v8:Type": "cfg:CatalogRef.СправочникПолный" } } },
    })
    const restored = testPropertyFromYAMLToXML({
      rule,
      yaml: imported.yaml,
      context: contexts.exportContext(),
    })

    expect(restored.xml).toEqual({
      Properties: {
        Type: { "v8:Type": "cfg:CatalogRef.СправочникПолный" },
      },
    })
  })

  it("читает DataProcessor из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDataProcessorRules,
      name: "ОбработкаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "ОбработкаВсеСвойства.xml",
        "ОбработкаВсеСвойства/Ext/ObjectModule.bsl",
        "ОбработкаВсеСвойства/Ext/ManagerModule.bsl",
        "ОбработкаВсеСвойства/Ext/Help.xml",
        "ОбработкаВсеСвойства/Ext/Help/ru.html",
        "ОбработкаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ОбработкаВсеСвойства/Forms/Форма.xml",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Form.xml",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Form/Module.bsl",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Help.xml",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Help/ru.html",
        "ОбработкаВсеСвойства/Templates/Макет.xml",
        "ОбработкаВсеСвойства/Templates/Макет/Ext/Template.txt",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      if (path.endsWith(".xml")) {
        expect(canonicalSnapshot13XML(result), path).toEqual(canonicalSnapshot13XML(expected))
      } else {
        expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
      }
    }
  })
})
