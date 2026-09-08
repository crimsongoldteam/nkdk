import { ExecutionPath } from "@nkdk/runtime/rule-kit"
import {
  parseMetadataYaml,
  parseXmlDocumentWithSaxes,
  xmlElementChildren,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"

import "./types"

import {
  testPropertyFixtureThroughYAML,
  testPropertiesYamlRoundTrip,
} from "../../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { fixtureDynamicListStructureItemGroupYAML } from "./__fixtures__/data"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../../projectDefinition/localIndexes"
import { importStructureItemGroupFromXMLToYAML } from "./fromXMLToYAML"

describe("StructureItemGroup XML → YAML", () => {
  it("обходит вложенные группы и элементы без compatibility-объектов", () => {
    const root = parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, "dynamicList.xml")).roots[0]!
    const nodes = [root]
    for (const node of nodes) {
      nodes.push(...xmlElementChildren(node))
      if (node.name === "dcsset:item" || node.name === "dcsset:groupItems") {
        Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Не читать compatibility группировки") } })
      }
    }
    expect(importStructureItemGroupFromXMLToYAML({
      context: mockContextFromXML(), rule: { type: "StructureItemGroup" }, xml: undefined,
      traversal: { pathCursor: ExecutionPath.from<string | number>([]), rulePath: [], collector: createLocalIndexesCollector(), xmlNodes: [root] },
    })).toEqual(fixtureDynamicListStructureItemGroupYAML)
  })

  it("imports dynamicList.xml as flat YAML", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "StructureItemGroup",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
      fixture: "dynamicList.xml",
    })

    expect(result.yaml).toEqual({ Значение: fixtureDynamicListStructureItemGroupYAML })
  })

  it("привязывает аномалии вложенных групп к доступным значениям YAML", () => {
    const sourceXML = readXMLFixtureAsString(import.meta.url, "dynamicList.xml")
    const result = testPropertiesYamlRoundTrip({
      rule: {
        itemType: "StructureItemGroupProbe",
        properties: {
          value: {
            type: "StructureItemGroup",
            yaml: "Значение",
            xml: "dcsset:item",
          },
        },
      },
      sourceXML,
    })

    expect(parseMetadataYaml(result.yamlText).data).toMatchObject({
      Значение: [
        "Наименование",
        "[Авто]",
        { Поле: "ПометкаУдаления", Использование: "Ложь" },
      ],
    })
    expect(parseXmlDocumentWithSaxes(result.result).roots[0]!.structuralHash)
      .toBe(parseXmlDocumentWithSaxes(sourceXML).roots[0]!.structuralHash)
  })
})
