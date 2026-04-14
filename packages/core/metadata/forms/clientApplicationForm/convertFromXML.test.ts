import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { getXMLFixtureDir, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { convertFormFromXML } from "./convertFromXML"

describe("import from XML string", () => {
  const inputDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const outputDir = getXMLFixtureDir(import.meta.url, "sync/out")
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

    const expectedNkdk = readXMLFixtureAsString(import.meta.url, join("sync/nkdk/Формы", formName, "Форма.nkdk"))
    const expectedYaml = readXMLFixtureAsString(import.meta.url, join("sync/nkdk/Формы", formName, "Форма.yaml"))

    const resultNkdk = fs.readFileSync(join(outputDir, "Формы", formName, "Форма.nkdk"), "utf-8")
    const resultYaml = fs.readFileSync(join(outputDir, "Формы", formName, "Форма.yaml"), "utf-8")

    expect(resultNkdk).toBe(expectedNkdk)
    expect(resultYaml).toBe(expectedYaml)
  })
})
