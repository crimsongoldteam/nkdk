import { describe,expect,it } from "vitest"

import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
createDirectRoundTripContexts,
readAppliedObjectFixture,
serializeDirectXML,
testMetadataItemFromXMLToYAML,
testMetadataItemFromYAMLToXML,
testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"
import { extensionContentXML } from "./__fixtures__/extension"


describe("ExchangePlanContent YAML → XML", () => {
  const ownerRule = {
    itemType: "ExchangePlanContentOwnerProbe",
    properties: {
      content: {
        type: "ExchangePlanContent",
        yaml: "Состав",
        xml: "Content",
      },
    },
  } as const satisfies MetadataItemRule

  it("не создаёт файл состава при отсутствии поля", () => {
    expect(testPropertyFromYAMLToXML({ rule: ownerRule, yaml: {} }).xml).toEqual({})
  })

  it("round-trips content items with Allow and Deny auto record", () => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, "content.xml")
    const result = testMetadataItemFromYAMLToXML({
      rule: ExchangePlanContentRules,
      yaml: contentYAML,
      referenceXML,
    })

    expect(normalizeXML(serializeDirectXML(result.xml))).toBe(
      normalizeXML(readXMLFixtureAsString(import.meta.url, "content.xml"))
    )
  })

  it("round-trips content items through the configuration snapshot without reference XML", () => {
    const source = readAppliedObjectFixture(import.meta.url, "content.xml")
    const roundTrip = createDirectRoundTripContexts()
    const imported = testMetadataItemFromXMLToYAML({
      rule: ExchangePlanContentRules,
      xml: source,
      context: roundTrip.importContext,
    })
    const restored = testMetadataItemFromYAMLToXML({
      rule: ExchangePlanContentRules,
      yaml: imported.yaml,
      context: roundTrip.exportContext(),
    })

    expect(normalizeXML(serializeDirectXML(restored.xml))).toBe(
      normalizeXML(readXMLFixtureAsString(import.meta.url, "content.xml"))
    )
  })

  it("восстанавливает Item и ExtensionProperty расширения без служебных полей YAML", () => {
    const contexts = createDirectRoundTripContexts()
    const importContext = {
      ...contexts.importContext,
      fromXML: {
        ...contexts.importContext.fromXML,
        componentKind: "configurationExtension" as const,
        metadataItemAugmenter: "configurationExtension",
        currentXMLDefaultVariant: "adopted" as const,
      },
    }
    const imported = testMetadataItemFromXMLToYAML({
      rule: ExchangePlanContentRules,
      xml: extensionContentXML(),
      context: importContext,
    })
    const baseExport = contexts.exportContext()
    const exportContext = {
      ...baseExport,
      exportToXML: {
        ...baseExport.exportToXML,
        componentKind: "configurationExtension" as const,
        xmlDefaultVariantByLogicalAddress: { "Test.Item": "adopted" as const },
      },
    }

    const restored = testMetadataItemFromYAMLToXML({
      rule: ExchangePlanContentRules,
      yaml: imported.yaml,
      context: exportContext,
    })

    expect(restored.xml).toHaveProperty("ExchangePlanContent.ExtensionProperty.Item", [
      { Metadata: "Document.ДокументВсеСвойстваExt", State: "Modify" },
      { Metadata: "Document.ДокументВсеСвойства", State: "Check" },
      { Metadata: "Catalog.СправочникВладелец", State: "Check" },
      { Metadata: "Document.ДокументСНумераторомExt", State: "Check" },
      { Metadata: "Catalog.СправочникПолный", State: "Modify" },
      { Metadata: "Document.ДокументСНумератором", State: "Check" },
      { Metadata: "Document.ДокументКнопкаСПараметрамиExt", State: "Modify" },
    ])
    expect(restored.xml).toHaveProperty("ExchangePlanContent.Item", [
      { Metadata: "Document.ДокументВсеСвойства", AutoRecord: "Allow" },
      { Metadata: "Catalog.СправочникПолный", AutoRecord: "Allow" },
      { Metadata: "Document.ДокументКнопкаСПараметрамиExt", AutoRecord: "Allow" },
      { Metadata: "Document.ДокументСНумераторомExt", AutoRecord: "Allow" },
    ])
  })

  it("не создаёт ExtensionProperty у собственного плана расширения", () => {
    const contexts = createDirectRoundTripContexts()
    const baseExport = contexts.exportContext()
    const context = {
      ...baseExport,
      exportToXML: {
        ...baseExport.exportToXML,
        componentKind: "configurationExtension" as const,
        xmlDefaultVariantByLogicalAddress: { "Test.Item": "full" as const },
      },
    }

    const result = testMetadataItemFromYAMLToXML({
      rule: ExchangePlanContentRules,
      yaml: contentYAML,
      context,
    })

    expect(result.xml).toHaveProperty("ExchangePlanContent.Item")
    expect(result.xml).not.toHaveProperty("ExchangePlanContent.ExtensionProperty")
  })

  it("imports content items with current AutoChangeRecord YAML values", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: ExchangePlanContentRules, yaml: contentYAML })

    expect(result.xml).toMatchObject({
      ExchangePlanContent: {
        Item: expect.arrayContaining([
          expect.objectContaining({ Metadata: expect.any(String), AutoRecord: expect.any(String) }),
        ]),
      },
    })
  })

  it("imports [] as explicit empty content", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: ExchangePlanContentRules, yaml: [] })

    expect(result.xml).toHaveProperty("ExchangePlanContent")
    expect(serializeDirectXML(result.xml)).not.toContain("<Item>")
  })

  it("exports empty content as an empty ExchangePlanContent container", () => {
    const result = testMetadataItemFromYAMLToXML({ rule: ExchangePlanContentRules, yaml: [] })
    const xml = serializeDirectXML(result.xml)

    expect(xml).toContain("<ExchangePlanContent")
    expect(xml).not.toContain("<Item>")
  })
})

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").trimEnd()
