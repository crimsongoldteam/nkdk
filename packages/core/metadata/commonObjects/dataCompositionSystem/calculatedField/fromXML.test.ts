import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullCalculatedField } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "CalculatedField" }

describe("import CalculatedField from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "CalculatedField",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullCalculatedField)
  })
})
