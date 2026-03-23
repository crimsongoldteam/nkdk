import { describe, expect, it } from "vitest"
import { fullContextMenu } from "~/metadata/forms/elements/contextMenu/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/importPropertyFromXML"

const rule: PropertyRule = {
  type: "ContextMenu",
}

describe("import ContextMenu from XML", () => {
  it("should import full from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "ContextMenu",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "ContextMenu",
      importMetaUrl: import.meta.url,
    })

    expect(result).toBeUndefined()
  })
})
