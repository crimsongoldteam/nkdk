import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../../../tests/property/importPropertyFromXML"
import { dynamicListGroupItemFieldDefault, dynamicListGroupItemFieldUseFalse } from "./__fixtures__/data"
import "./index"

const rule = { type: "GroupItemField" } as const

describe("import GroupItemField from XML", () => {
  it("imports dynamicList.xml (use=false)", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "dynamicList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(dynamicListGroupItemFieldUseFalse)
  })

  it("imports dynamicListDefault.xml (use=true)", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "dynamicListDefault.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(dynamicListGroupItemFieldDefault)
  })
})
