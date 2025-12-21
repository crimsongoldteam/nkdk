import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { multipleAttributes } from "~/lib/tests/fixtures/metadataAttribute/multiple"
import { singleAttribute } from "~/lib/tests/fixtures/metadataAttribute/single"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportMetadataAttributesToXML } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "8f93c5cf-a2f6-4d79-ab40-83f36042b478"),
}))

describe("exportMetadataAttributesToXML", () => {
  it("should export single attribute to XML", () => {
    const expectedResult = readFileSync(join(process.cwd(), "tests/fixtures/metadataAttribute/single.xml"), "utf-8")

    const xmlData = exportMetadataAttributesToXML(singleAttribute, mockConfigurationSettings)

    const result = xmlExport({ Attribute: xmlData }, false).trim()

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes to XML", () => {
    const expectedResult = readFileSync(join(process.cwd(), "tests/fixtures/metadataAttribute/multiple.xml"), "utf-8")

    const xmlData = exportMetadataAttributesToXML(multipleAttributes, mockConfigurationSettings)

    const result = xmlExport({ Attribute: xmlData }, false).trim()

    expect(result).toEqual(expectedResult)
  })
})
