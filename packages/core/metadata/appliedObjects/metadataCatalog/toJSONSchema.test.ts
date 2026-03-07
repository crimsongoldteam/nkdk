import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { exportMetadataCatalogToJSONSchema } from "./toJSONSchema"

describe("MetadataCatalog to JSONSchema", () => {
  it("export MetadataCatalog to JSONSchema", () => {
    const expectedResult = readXMLFileAsString("metadataCatalog/schema.json")
    const schema = exportMetadataCatalogToJSONSchema({
      context: mockContext,
    })
    const out = JSON.stringify(schema, null, 2)
    expect(out).toEqual(expectedResult)
  })
})
