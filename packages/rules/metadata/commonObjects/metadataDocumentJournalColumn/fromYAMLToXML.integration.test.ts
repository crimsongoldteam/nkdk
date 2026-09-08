import { describe, expect, it } from "vitest"

import {
  testPropertyFromYAMLToXML,
  testPropertiesYamlRoundTrip,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { columnsYAML } from "./__fixtures__/data"

import "./register"

const rule = {
  itemType: "DocumentJournalColumnsProbe",
  properties: {
    columns: { type: "MetadataDocumentJournalColumns", yaml: "Графы", xml: "Columns" },
  },
} as MetadataItemRule

describe("MetadataDocumentJournalColumns YAML → XML", () => {
  it("imports collection from YAML map keyed by name", () => {
    const result = testPropertyFromYAMLToXML({ rule, yaml: { Графы: columnsYAML } })

    expect(result.xml).toMatchObject({
      Columns: {
        Column: expect.arrayContaining([
          expect.objectContaining({ Properties: expect.objectContaining({ Name: "Документ" }) }),
        ]),
      },
    })
  })

  it("round-trips document journal columns", () => {
    const sourceXML = readXMLFixtureAsString(import.meta.url, "columns.xml")
    const result = testPropertiesYamlRoundTrip({
      rule: { ...rule, properties: { columns: { ...rule.properties.columns!, xml: "Column" } } },
      sourceXML,
    })

    expect(normalizeXML(result.result)).toBe(normalizeXML(sourceXML))
  })
})

const normalizeXML = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\n/, "").replace(/\r\n/g, "\n").trimEnd()
