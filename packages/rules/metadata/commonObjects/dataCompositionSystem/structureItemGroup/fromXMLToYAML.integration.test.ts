import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../tests/directConversion"
import { fixtureDynamicListStructureItemGroupYAML } from "./__fixtures__/data"

import "./types"

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
})
