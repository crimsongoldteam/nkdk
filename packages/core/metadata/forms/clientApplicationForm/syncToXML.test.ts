import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncFormToXML } from "./syncToXML"

describe("sync ClientApplicationForm to XML", () => {
  const inputDir = getXMLFixturePath("sync/syncForm/nkdk")
  const referenceDir = getXMLFixturePath("sync/syncForm/xml/Forms")
  const outputDir = getXMLFixturePath("sync/syncForm/out")
  const formName = "ФормаЭлемента"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read form from YAML/nkdk and export to XML files in output dir", async () => {
    await syncFormToXML({
      context: mockContextToXML(),
      inputDir: inputDir,
      outputDir: outputDir,
      referenceDir: referenceDir,
      formName,
    })

    const expectedFormXML = readXMLFileAsString(join("sync/syncForm/xml/Forms", formName, "Ext", "Form.xml"))
    const expectedMetadataXML = readXMLFileAsString(join("sync/syncForm/xml/Forms", "ФормаЭлемента.xml"))

    const resultFormXML = readXMLFileAsString(join("sync/syncForm/out", "Forms", formName, "Ext", "Form.xml"))
    const resultMetadataXML = readXMLFileAsString(join("sync/syncForm/out", "Forms", "ФормаЭлемента.xml"))

    expect(resultFormXML).toBe(expectedFormXML)
    expect(resultMetadataXML).toBe(expectedMetadataXML)
  })
})
