import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { convertFormFromXML } from "./convertFromXML"
import { mockContextFromXML } from "~/tests/mockContext"

describe("import from XML string", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/xml/Forms")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/out")
  const formName = "ФормаЭлемента"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read form from XML and export to YAML file in output dir", async () => {
    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir,
      formName,
      outputDir,
    })

    const expectedNkdk = readXMLFileAsString(join("sync/syncForm/nkdk/Формы", formName, "Форма.nkdk"))
    const expectedYaml = readXMLFileAsString(join("sync/syncForm/nkdk/Формы", formName, "Форма.yaml"))

    const resultNkdk = fs.readFileSync(join(outputDir, "Формы", formName, "Форма.nkdk"), "utf-8")
    const resultYaml = fs.readFileSync(join(outputDir, "Формы", formName, "Форма.yaml"), "utf-8")

    expect(resultNkdk).toBe(expectedNkdk)
    expect(resultYaml).toBe(expectedYaml)
  })
})
