import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"

import {
  testPropertyFixtureThroughYAML,
  withDirectMetadataExecution,
} from "../../../../../../tests/directConversion"
import { mockContextFromXML } from "../../../../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../../../../tests/readFixtureXML"
import { createLocalIndexesCollector } from "../../../../../projectDefinition/localIndexes"
import {
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalseYAML,
} from "./__fixtures__/data"

import "./index"
import { importGroupItemFieldFromXMLToYAML } from "./fromXMLToYAML"

describe("GroupItemField XML → YAML", () => {
  it("imports dynamicList.xml (use=false)", () => {
    const result = convert("dynamicList.xml")

    expect(result.yaml).toEqual({ Значение: dynamicListGroupItemFieldUseFalseYAML })
  })

  it("imports dynamicListDefault.xml (use=true)", () => {
    const result = convert("dynamicListDefault.xml")

    expect(result.yaml).toEqual({ Значение: dynamicListGroupItemFieldDefaultYAML })
  })

  it("сохраняет компактную строку при импорте адресного XML-узла", () => {
    const { yaml, annotations } = importAddressedGroupItem(
      readXMLFixtureAsString(import.meta.url, "dynamicListDefault.xml"),
    )

    expect(yaml).toBe(dynamicListGroupItemFieldDefaultYAML)
    expect([...annotations.entries()]).toEqual([])
  })

  it("не сворачивает неизвестное XML-свойство вместе с техническими значениями", () => {
    const source = readXMLFixtureAsString(import.meta.url, "dynamicListDefault.xml")
      .replace("</dcsset:item>", "\t<dcsset:future>42</dcsset:future>\n</dcsset:item>")
    const { yaml, annotations } = importAddressedGroupItem(source)

    expect(yaml).toEqual(expect.objectContaining({ Поле: "Наименование" }))
    expect([...annotations.entries()]).toContainEqual(expect.objectContaining({
      parent: yaml,
      key: "dcsset:future",
    }))
  })
})

const convert = (fixture: string) =>
  testPropertyFixtureThroughYAML({
    propertyType: "GroupItemField",
    xmlRootTag: "dcsset:item",
    importMetaUrl: import.meta.url,
    fixture,
  })

function importAddressedGroupItem(source: string) {
  const root = parseXmlDocumentWithSaxes(source).roots[0]!
  const audit = createXmlImportAuditSession([root])
  const annotations = createXmlAnomalyAnnotations()
  const yaml = withDirectMetadataExecution(() => importGroupItemFieldFromXMLToYAML({
    context: mockContextFromXML(),
    rule: { type: "GroupItemField" },
    xml: root,
    traversal: {
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      xmlNodes: [root],
      audit,
      annotations,
    },
  }))
  return { yaml, annotations }
}
