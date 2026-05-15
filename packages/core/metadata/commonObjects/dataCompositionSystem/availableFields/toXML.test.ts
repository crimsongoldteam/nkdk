import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { availableFieldsWithLwsTitleAndFalseUse, fullAvailableFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("export available fields to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullAvailableFields,
      xmlRootTag: "dcsset:selection",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports false use and lwsTitle", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: availableFieldsWithLwsTitleAndFalseUse,
      xmlRootTag: "dcsset:selection",
      referenceMetadata: undefined,
    })

    expect(result).toEqual(`<dcsset:selection>
\t<dcsset:item>
\t\t<dcsset:field>Документ</dcsset:field>
\t\t<dcsset:use>false</dcsset:use>
\t\t<dcsset:lwsTitle>
\t\t\t<v8:item>
\t\t\t\t<v8:lang>ru</v8:lang>
\t\t\t\t<v8:content>Многоязычный документ</v8:content>
\t\t\t</v8:item>
\t\t</dcsset:lwsTitle>
\t</dcsset:item>
</dcsset:selection>`)
  })
})
