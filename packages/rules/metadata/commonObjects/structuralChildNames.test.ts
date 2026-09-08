import { xmlElementChildren } from "@nkdk/runtime"
import { xmlFixtureValue as importContentFromXML } from "../../tests/xmlFixtureValue"
import { describe, expect, it } from "vitest"
import { createDirectRoundTripContexts } from "../../tests/directConversion"
import { mockContextFromXML, mockRule } from "../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../tests/structuralXML"
import { metadataPropertyRule000 as forms, metadataPropertyRule001 as formIndex } from "./childFormNames/fromXML"
import { metadataPropertyRule000 as templates, metadataPropertyRule001 as templateIndex } from "./childTemplateNames/fromXML"
import { metadataPropertyRule000 as files, metadataPropertyRule001 as fileIndex } from "./childFileItemNames/fromXML"
import { metadataPropertyRule000 as subsystems } from "./childSubsystemNames/fromXML"

const readers = [
  { name: "forms", read: forms.handler, filterEmpty: false },
  { name: "templates", read: templates.handler, filterEmpty: false },
  { name: "files", read: files.handler, filterEmpty: true },
  { name: "subsystems", read: subsystems.handler, filterEmpty: false },
] as const

describe("structural child names", () => {
  for (const { name, read, filterEmpty } of readers) {
    it.each([
      ["<Root><Name>Б</Name><Name>А</Name></Root>", ["Б", "А"]],
      ["<Root><Name>А</Name><Name>А</Name></Root>", ["А", "А"]],
      ["<Root><Name/><Name>А</Name></Root>", filterEmpty ? ["А"] : [undefined, "А"]],
    ])(`preserves ${name}: %s`, (xml, expected) => {
      const legacy = importContentFromXML<{ Root: { Name: unknown } }>(xml).Root.Name
      expect(read(mockContextFromXML(), mockRule, legacy)).toEqual(expected)
      expect(read(mockContextFromXML(), mockRule, xmlElementChildren(parseStructuralXMLWithoutCompatibility(xml)))).toEqual(expected)
    })

    it(`omits a single empty ${name} node`, () => {
      expect(read(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility("<Name/>"))).toBeUndefined()
    })
  }

  for (const [xmlName, collect] of [["Form", formIndex.handler], ["Template", templateIndex.handler], ["Table", fileIndex.handler]] as const) {
    it(`preserves indexed ${xmlName} order`, () => {
      const xml = `<Root><${xmlName}>Б</${xmlName}><${xmlName}>А</${xmlName}></Root>`
      const snapshot = (value: unknown) => {
        const contexts = createDirectRoundTripContexts({ logicalAddress: "Объект.Тест", targetProjectPath: "Тест.yaml" })
        collect({ context: contexts.importContext, rule: { ...mockRule, xml: xmlName }, xml: value, propertyKey: "children" })
        return contexts.importContext.fromXML.configurationIndex?.collector.fragment("Тест.yaml").entities
      }
      const expected = snapshot(importContentFromXML<{ Root: Record<string, unknown> }>(xml).Root[xmlName])
      expect(expected?.[0]?.children?.map(child => child.name)).toEqual(["Б", "А"])
      expect(snapshot(xmlElementChildren(parseStructuralXMLWithoutCompatibility(xml)))).toEqual(expected)
    })
  }
})
