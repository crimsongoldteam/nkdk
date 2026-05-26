import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import "./register"

const rule = { type: "MetadataExternalDataSourceCubeDimension", xml: "Dimension" } as const

describe("MetadataExternalDataSourceCubeDimension XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (path) => {
    const data = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "Dimension",
      importMetaUrl: import.meta.url,
    })

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "Dimension",
      path,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
