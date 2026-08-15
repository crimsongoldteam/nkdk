import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"

import { MetadataInformationRegisterAttributeRules } from "../../appliedObjects/metadataInformationRegister/childRules"

describe("MetadataRegisterAttributes YAML → XML", () => {
  it("round-trips register attributes", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataInformationRegisterAttributes",
      itemRule: MetadataInformationRegisterAttributeRules,
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
      fixture: "attributes.xml",
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
