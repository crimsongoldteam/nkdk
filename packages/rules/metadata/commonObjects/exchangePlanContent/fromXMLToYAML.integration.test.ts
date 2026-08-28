import { describe,expect,it } from "vitest"

import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { yamlScalarTagAt } from "@nkdk/runtime"
import {
createDirectRoundTripContexts,
readAppliedObjectFixture,
testMetadataItemFromXMLToYAML,
testPropertyFromXMLToYAML,
} from "../../../tests/directConversion"
import { contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"
import { extensionContentXML, extensionContentYAML } from "./__fixtures__/extension"


describe("ExchangePlanContent XML → YAML", () => {
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

  it("не создаёт Состав при отсутствии файла", () => {
    expect(testPropertyFromXMLToYAML({ rule: ownerRule, xml: {} }).yaml).toEqual({})
  })

  it("imports content items with Allow and Deny auto record", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "content.xml")

    expect(testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml }).yaml).toEqual(contentYAML)
  })

  it("объединяет Item и ExtensionProperty расширения в один Состав", () => {
    const contexts = createDirectRoundTripContexts()
    const context = {
      ...contexts.importContext,
      fromXML: {
        ...contexts.importContext.fromXML,
        componentKind: "configurationExtension" as const,
        metadataItemAugmenter: "configurationExtension",
      },
    }
    const yaml = testMetadataItemFromXMLToYAML({
      rule: ExchangePlanContentRules,
      context,
      xml: extensionContentXML(),
    }).yaml as Record<string, unknown>[]

    expect(yaml).toEqual(extensionContentYAML)
    expect(yamlScalarTagAt(yaml[0], "Метаданные")).toBe("изменять")
    expect(yamlScalarTagAt(yaml[4], "Метаданные")).toBe("изменять")
    expect(yamlScalarTagAt(yaml[1], "Метаданные")).toBeUndefined()
  })

  it("imports empty content as an explicit empty list", () => {
    const xml = { ExchangePlanContent: {} }

    expect(testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml }).yaml).toEqual([])
  })

  it("exports content items with current AutoChangeRecord YAML values", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "content.xml")

    expect(testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml }).yaml).toEqual(contentYAML)
  })

  it("exports empty content as []", () => {
    expect(
      testMetadataItemFromXMLToYAML({ rule: ExchangePlanContentRules, xml: { ExchangePlanContent: {} } }).yaml
    ).toEqual([])
  })
})
