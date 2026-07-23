import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../../../tests/directConversion"
import {
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalseYAML,
} from "./__fixtures__/data"

import "../../collection/types"
import "./index"

describe("GroupItemField YAML → XML", () => {
  it("exports dynamicList.xml (use=false)", () => {
    const result = convert("dynamicList.xml", dynamicListGroupItemFieldUseFalseYAML)

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("exports dynamicListDefault.xml (use=true)", () => {
    const result = convert("dynamicListDefault.xml", dynamicListGroupItemFieldDefaultYAML)

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const convert = (fixture: string, yaml: unknown) =>
  testPropertyFixtureThroughYAML({
    propertyType: "StructureItemGroupCollection",
    xmlRootTag: "dcsset:item",
    importMetaUrl: import.meta.url,
    fixture,
    yaml: { Значение: [yaml] },
  })

const normalize = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trim()
