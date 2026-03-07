import { describe, expect, it } from "vitest"
import { readFormFromXML } from "~/sync/readForm"
import { readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/readForm/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"

describe("readForm", () => {
  it("should read form from XML to NKDK and YAML", async () => {
    const xml = readXMLFileAsString("sync/readForm/data.xml")
    const result = await readFormFromXML({
      context: mockContextToYAML,
      xml,
      formName: "TestForm",
    })

    expect(result.yaml).toEqual(readFormYAML)
    expect(result.nkdk).toEqual(readFormNKDK)
  })
})
