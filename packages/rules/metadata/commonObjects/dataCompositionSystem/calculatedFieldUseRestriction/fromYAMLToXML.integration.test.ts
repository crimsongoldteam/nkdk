import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../tests/directConversion"
import { fullUseRestrictionYAML } from "./__fixtures__/data"

import "./types"

describe("CalculatedFieldUseRestriction YAML → XML", () => {
  it("imports full YAML and exports full.xml", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "CalculatedFieldUseRestriction",
      xmlRootTag: "dcssch:useRestriction",
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      yaml: { Значение: fullUseRestrictionYAML },
    })

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const normalize = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trim()
