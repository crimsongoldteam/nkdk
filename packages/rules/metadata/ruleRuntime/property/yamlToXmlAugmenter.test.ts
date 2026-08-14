import { beforeAll, describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { convertPropertiesFromYAMLToXML } from "./fromYAMLToXML"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"
import { createMetadataItemYamlToXmlAugmenterRegistry, registerMetadataItemYamlToXmlAugmenter } from "./yamlToXmlAugmenter"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import { mockLanguages } from "../../../tests/mockContext"

const calls: Array<{ itemType: string; logicalAddress: string }> = []

const leafRule = rule("Leaf", {
  name: { type: "string", xml: "Name" },
})
const childRule = rule("Child", {
  name: { type: "string", xml: "Name" },
  leaves: {
    type: "RecursiveAugmenterLeaves" as never,
    yaml: "Поля",
    xml: "Leaf",
  },
})
beforeAll(() => {
registerMetadataItemYamlToXmlAugmenter("recursive-augmenter-test", {
  augment({ rule, logicalAddress }) {
    calls.push({ itemType: rule.itemType, logicalAddress })
  },
})
registerTypeRule("RecursiveAugmenterLeaves" as never, "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: leafRule,
  yamlShape: "record",
  xmlElement: "Leaf",
  configurationIndexUidSegment: "Поле",
})
registerTypeRule("RecursiveAugmenterChildren" as never, "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: childRule,
  yamlShape: "record",
  xmlElement: "Child",
  configurationIndexUidSegment: "Реквизит",
})
})

describe("metadata item YAML-to-XML augmenter", () => {
  it("isolates augmenters between registry instances", () => {
    const calls: string[] = []
    const createRegistry = (value: string) => createMetadataItemYamlToXmlAugmenterRegistry([{
      componentKind: "sample",
      augmenter: { augment: () => { calls.push(value) } },
    }])
    const baseContext = context()
    const sampleContext = { ...baseContext, exportToXML: { ...baseContext.exportToXML, componentKind: "sample" } }
    const params = { context: sampleContext, rule: rule("Root", {}), yaml: {}, outputs: new Map() }

    createRegistry("first").augment(params)
    createRegistry("second").augment(params)

    expect(calls).toEqual(["first", "second"])
  })

  it("runs at root, nested item and second-level nested item boundaries", () => {
    calls.splice(0)
    convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {
        Реквизиты: {
          Один: {
            Поля: {
              Два: {},
            },
          },
        },
      },
      rule: rule("Root", {
        children: {
          type: "RecursiveAugmenterChildren" as never,
          yaml: "Реквизиты",
          xml: "Child",
        },
      }),
      outputs: [{ key: "metadata" }],
    })

    expect(calls).toEqual([
      { itemType: "Leaf", logicalAddress: "Root.Реквизит.Один.Поле.Два" },
      { itemType: "Child", logicalAddress: "Root.Реквизит.Один" },
      { itemType: "Root", logicalAddress: "Root" },
    ])
  })
})

function context(): ConfigurationContextWithExportToXML {
  return {
    version: "2.20",
    languages: mockLanguages,
    exportToXML: {
      version: "2.20",
      itemsTree: [],

      componentKind: "recursive-augmenter-test",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: testConfigurationIndexReader(),
        collector: createConfigurationIndexCollector(),
        targetProjectPath: "root.yaml",
        logicalAddress: "Root",
      }),
    },
  }
}

function rule(
  itemType: string,
  properties: MetadataItemRule["properties"]
): MetadataItemRule {
  return { itemType, properties }
}
