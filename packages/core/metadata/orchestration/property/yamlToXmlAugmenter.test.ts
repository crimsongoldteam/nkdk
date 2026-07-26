import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertPropertiesFromYAMLToXML } from "./fromYAMLToXML"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"
import { registerMetadataItemYamlToXmlAugmenter } from "./yamlToXmlAugmenter"

const calls: Array<{ itemType: string; logicalAddress: string }> = []
registerMetadataItemYamlToXmlAugmenter("recursive-augmenter-test", {
  augment({ rule, logicalAddress }) {
    calls.push({ itemType: rule.itemType, logicalAddress })
  },
})

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

describe("metadata item YAML-to-XML augmenter", () => {
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
    defaultLanguage: "ru",
    exportToXML: {
      version: "2.20",
      itemsTree: [],
      configDumpInfo: new Map(),
      componentKind: "recursive-augmenter-test",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: createConfigurationIndexReader(
          snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))
        ),
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
