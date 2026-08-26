import { serializeYAMLDocument } from "@nkdk/runtime"
import type { MetadataItemRule,PropertyRule } from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import { createDirectRoundTripContexts,testPropertyFromXMLToYAML } from "../../../../tests/directConversion"
import { mockContext } from "../../../../tests/mockContext"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { exportPropertyToYAML } from "../../../ruleRuntime/property/toYAML"
import { fixtureDcsLocalStringTwoLangs } from "./__fixtures__/data"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../../composition/metadataRules"

import "./fromXML"
import "./toYAML"

const rule: PropertyRule = { type: "DcsLocalStringType", yaml: "Заголовок" }
const xmlRootTag = "dcsset:userSettingPresentation"
const execution = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

describe("DcsLocalStringType XML → YAML", () => {

  it("imports one-language LocalStringType as ordinary YAML", () => {
    expect(importAndSerialize("localString.xml")).toBe("Заголовок: Один язык - local string")
  })

  it("imports xs:string as !xml/string", () => {
    expect(importAndSerialize("string.xml")).toBe(
      "Заголовок: !xml/string Один язык - string",
    )
  })

  it("imports two-language LocalStringType as ordinary YAML", () => {
    const value = importFixture("localStringTwoLangs.xml")

    expect(value).toEqual(fixtureDcsLocalStringTwoLangs)
  })

  it("does not collect xsiType in the configuration snapshot", () => {
    const contexts = createDirectRoundTripContexts()
    const ownerRule = {
      itemType: "DcsLocalStringSnapshotProbe",
      properties: {
        title: { ...rule, xml: "Title" },
      },
    } as MetadataItemRule
    testPropertyFromXMLToYAML({
      rule: ownerRule,
      context: contexts.importContext,
      xml: { Title: { "_xsi:type": "xs:string", "#text": "Текст" } },
    })

    const fragment = contexts.importContext.fromXML.configurationIndex?.collector.fragment("Тест.yaml")
    expect(JSON.stringify(fragment?.entities)).not.toContain("xsiType")
  })
})

function importAndSerialize(path: string): string {
  const value = importFixture(path)
  const yaml = exportPropertyToYAML({ context: mockContext, rule, value, execution })
  if (yaml === undefined) throw new Error("DcsLocalStringType не экспортирован")
  return serializeYAMLDocument(yaml).text.trim()
}

function importFixture(path: string): unknown {
  return testImportPropertyFromXML({ rule, path, xmlRootTag, importMetaUrl: import.meta.url })
}
