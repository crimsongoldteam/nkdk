import { describe, expect, it } from "vitest"
import { XML_PRESENT_TAG_VALUE, markYAMLScalarTag } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { testPropertyFromYAMLToXML } from "../../../tests/directConversion"

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

describe("IndexField YAML → XML", () => {
  it("восстанавливает явный пустой AdditionalFields", () => {
    const yaml = { ДополнительныеПоля: XML_PRESENT_TAG_VALUE }
    markYAMLScalarTag(yaml, "ДополнительныеПоля", "xml/present")

    expect(testPropertyFromYAMLToXML({ rule, yaml }).xml).toEqual({ AdditionalFields: {} })
  })
})
