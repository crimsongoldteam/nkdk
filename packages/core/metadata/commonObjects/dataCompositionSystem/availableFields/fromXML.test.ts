import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { availableFieldsWithLwsTitleAndFalseUse, fullAvailableFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import available fields from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:selection",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullAvailableFields)
  })

  it("imports false use and lwsTitle", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:selection",
      xmlString: `
<dcsset:selection>
  <dcsset:item>
    <dcsset:field>Документ</dcsset:field>
    <dcsset:use>false</dcsset:use>
    <dcsset:lwsTitle>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Многоязычный документ</v8:content>
      </v8:item>
    </dcsset:lwsTitle>
  </dcsset:item>
</dcsset:selection>`,
    })

    expect(result).toEqual(availableFieldsWithLwsTitleAndFalseUse)
  })
})
