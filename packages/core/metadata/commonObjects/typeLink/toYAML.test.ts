import { describe, expect, it } from "vitest"
import {
  catalogTabularAttributeTypeLink,
  catalogTabularAttributeTypeLinkLinkItem0,
  typeLinkYamlCatalogWithLinkItem,
  typeLinkYamlCatalogWithoutLinkItem,
} from "./__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const rule: PropertyRule = {
  type: "TypeLink",
  yaml: "value",
}

describe("export TypeLink to YAML", () => {
  it("exports without link item", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: catalogTabularAttributeTypeLinkLinkItem0,
    })

    expect(result).toEqual({ value: typeLinkYamlCatalogWithoutLinkItem })
  })

  it("exports with link item", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: catalogTabularAttributeTypeLink,
    })

    expect(result).toEqual({ value: typeLinkYamlCatalogWithLinkItem })
  })

  it("returns undefined for undefined value", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })
})
