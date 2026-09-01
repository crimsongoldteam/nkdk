import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  projectXmlAuditRemainder,
  snapshotXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"

import "./types"

import {
  testPropertyFixtureThroughYAML,
  testPropertyFromXMLToYAML,
} from "../../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { fixtureDynamicListStructureItemGroupYAML } from "./__fixtures__/data"

describe("StructureItemGroup XML → YAML", () => {
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
    const document = parseXmlDocumentWithSaxes(
      `<Probe>${readXMLFixtureAsString(import.meta.url, "dynamicList.xml")}</Probe>`,
      { preserveXsiNil: true },
    )
    const root = document.roots[0]!
    const audit = createXmlImportAuditSession([root])
    const annotations = createXmlAnomalyAnnotations()
    const result = testPropertyFromXMLToYAML({
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
      xml: root,
      audit,
      annotations,
    })

    expect(result.yaml).toMatchObject({
      Значение: [
        "Наименование",
        "[Авто]",
        { Поле: "ПометкаУдаления", Использование: "Ложь" },
      ],
    })
    const yaml = result.yaml
    if (!isRecord(yaml)) throw new Error("Ожидался YAML группировки")
    projectXmlAuditRemainder({
      yaml,
      annotations,
      audit,
      root,
      boundary: {
        itemType: "StructureItemGroupProbe",
        yamlPath: [],
        rulePath: [],
      },
    })
    audit.finalize()
    expect(() => snapshotXmlAnomalyAnnotations(yaml, annotations)).not.toThrow()
  })
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
