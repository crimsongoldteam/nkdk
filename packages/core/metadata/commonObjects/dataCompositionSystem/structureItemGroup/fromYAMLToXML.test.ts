import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../tests/directConversion"
import { fixtureDynamicListStructureItemGroupYAML } from "./__fixtures__/data"

import "./types"

describe("StructureItemGroup YAML → XML", () => {
  it("imports full fixture and exports dynamicList.xml", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "StructureItemGroup",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
      fixture: "dynamicList.xml",
      yaml: { Значение: fixtureDynamicListStructureItemGroupYAML },
    })

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const normalize = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trim()
