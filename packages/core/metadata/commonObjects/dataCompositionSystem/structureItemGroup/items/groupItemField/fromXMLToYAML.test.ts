import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../../../tests/directConversion"
import {
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalseYAML,
} from "./__fixtures__/data"

import "./index"

describe("GroupItemField XML → YAML", () => {
  it("imports dynamicList.xml (use=false)", () => {
    const result = convert("dynamicList.xml")

    expect(result.yaml).toEqual({ Значение: dynamicListGroupItemFieldUseFalseYAML })
  })

  it("imports dynamicListDefault.xml (use=true)", () => {
    const result = convert("dynamicListDefault.xml")

    expect(result.yaml).toEqual({ Значение: dynamicListGroupItemFieldDefaultYAML })
  })
})

const convert = (fixture: string) =>
  testPropertyFixtureThroughYAML({
    propertyType: "GroupItemField",
    xmlRootTag: "dcsset:item",
    importMetaUrl: import.meta.url,
    fixture,
  })
