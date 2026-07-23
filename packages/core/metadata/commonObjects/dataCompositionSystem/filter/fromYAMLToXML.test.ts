import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../tests/directConversion"
import { fullFilterFixtureYAML } from "./__fixtures__/data"

import "./types"

describe("Filter YAML → XML", () => {
  it("imports full YAML and exports full XML", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "Filter",
      xmlRootTag: "dcsset:filter",
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      yaml: { Значение: fullFilterFixtureYAML },
    })

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const normalize = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trim()
