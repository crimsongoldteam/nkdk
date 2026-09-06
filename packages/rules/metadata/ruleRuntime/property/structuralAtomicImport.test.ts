import { createDirectImportFactsCollector, createRuleRegistrySet, importPropertiesFromXMLToYAML, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { mockContextFromXML } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("compiled structural atomic import", () => {
  it.each([false, true])("passes XML nodes without retaining them in facts, facts-only: %s", factsOnly => {
    const execution = createRuleRegistrySet(metadataRules).execution
    const context = mockContextFromXML()
    const rule: MetadataItemRule = {
      itemType: "AtomicOwner",
      properties: {
        text: { type: "string", xml: "Text", yaml: "Текст" },
        number: { type: "number", xml: "Number", yaml: "Число" },
        boolean: { type: "boolean", xml: "Boolean", yaml: "Булево" },
        alignment: { type: "SystemEnumeration", typeSE: "HorizontalAlign", xml: "Alignment", yaml: "Выравнивание" },
      },
    }
    const xml = parseStructuralXMLWithoutCompatibility('<Root><Text xsi:type="xs:string">Текст</Text><Number xsi:type="xs:decimal">2</Number><Boolean xsi:type="xs:boolean">true</Boolean><Alignment>Center</Alignment></Root>')
    const facts = createDirectImportFactsCollector()
    const yaml = importPropertiesFromXMLToYAML({
      context, rule, execution, sources: [{ context, xml }], yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(),
      facts, ...(factsOnly ? { mode: "facts" as const } : {}),
    })
    if (!factsOnly) expect(yaml).toEqual({ Текст: "Текст", Число: 2, Булево: "Истина", Выравнивание: "Центр" })
    expect(Object.fromEntries(facts.finish().map(fact => [fact.yamlPath.at(-1), fact.value])))
      .toEqual({ Текст: "Текст", Число: 2, Булево: "Истина", Выравнивание: "Центр" })
    expect(facts.finish().every(fact => fact.reconstructionValue === undefined || typeof fact.reconstructionValue !== "object")).toBe(true)
  })
})
