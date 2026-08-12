import { describe, expect, it } from "vitest"
import { EMPTY_XML_TAG_VALUE, yamlScalarTagAt } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"

const rule = {
  itemType: "IndexField",
  properties: {
    additionalFields: {
      type: "IndexField",
      yaml: "ДополнительныеПоля",
      xml: "AdditionalFields",
    },
  },
} as const satisfies MetadataItemRule

describe("IndexField XML → YAML", () => {
  it("различает отсутствие, пустой элемент и заполненную коллекцию", () => {
    const absent = testPropertyFromXMLToYAML({ rule, xml: {} }).yaml as Record<string, unknown>
    const empty = testPropertyFromXMLToYAML({ rule, xml: { AdditionalFields: {} } }).yaml as Record<string, unknown>
    const parsedEmpty = testPropertyFromXMLToYAML({ rule, xml: { AdditionalFields: "" } }).yaml as Record<string, unknown>
    const filled = testPropertyFromXMLToYAML({
      rule,
      xml: { AdditionalFields: { Field: "Сумма" } },
    }).yaml as Record<string, unknown>

    expect(absent).not.toHaveProperty("ДополнительныеПоля")
    expect(empty.ДополнительныеПоля).toBe(EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(empty, "ДополнительныеПоля")).toBe("xml")
    expect(parsedEmpty.ДополнительныеПоля).toBe(EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(parsedEmpty, "ДополнительныеПоля")).toBe("xml")
    expect(filled.ДополнительныеПоля).toEqual(["Сумма"])
  })
})
