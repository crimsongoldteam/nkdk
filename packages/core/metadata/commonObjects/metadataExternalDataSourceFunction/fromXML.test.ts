import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import "./register"

const rule = { type: "MetadataExternalDataSourceFunction", xml: "Function" } as const

describe("MetadataExternalDataSourceFunction XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (path) => {
    const data = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "Function",
      importMetaUrl: import.meta.url,
    })

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "Function",
      path,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
