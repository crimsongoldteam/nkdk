import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { getXMLFixtureDir, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { syncFormToXML } from "./syncToXML"

describe("sync ClientApplicationForm to XML", () => {
  const inputDir = getXMLFixtureDir(import.meta.url, "sync/nkdk")
  const referenceDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const outputDir = getXMLFixtureDir(import.meta.url, "sync/out")
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

    const expectedFormXML = readXMLFixtureAsString(
      import.meta.url,
      join("sync/xml/Forms", formName, "Ext", "Form.xml")
    )
    const expectedMetadataXML = readXMLFixtureAsString(
      import.meta.url,
      join("sync/xml/Forms", "ФормаЭлемента.xml")
    )

    const resultFormXML = fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"), "utf-8")
    const resultMetadataXML = fs.readFileSync(join(outputDir, "Forms", "ФормаЭлемента.xml"), "utf-8")

    expect(resultFormXML).toBe(expectedFormXML)
    expect(resultMetadataXML).toBe(expectedMetadataXML)
  })
})
