import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncConfigurationFromXML } from "./convertFromXML"

describe("sync configuration from xml", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/xml")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/syncConfiguration/out")

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should produce catalog and form YAML/nkdk in output dir", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    const expectedFormNkdk = readXMLFileAsString(
      join("sync/syncConfiguration/nkdk/Справочник/Контрагенты/Формы/ФормаЭлемента", "Форма.nkdk")
    )
    const expectedFormYaml = readXMLFileAsString(
      join("sync/syncConfiguration/nkdk/Справочник/Контрагенты/Формы/ФормаЭлемента", "Форма.yaml")
    )

    const expectedCatalogYaml = readXMLFileAsString(
      join("sync/syncConfiguration/nkdk/Справочник/Контрагенты", "Свойства.yaml")
    )

    const resultFormNkdk = fs.readFileSync(
      join(outputDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.nkdk"),
      "utf-8"
    )
    const resultFormYaml = fs.readFileSync(
      join(outputDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"),
      "utf-8"
    )
    const resultCatalogYaml = fs.readFileSync(join(outputDir, "Справочник", "Контрагенты", "Свойства.yaml"), "utf-8")

    expect(resultCatalogYaml).toBe(expectedCatalogYaml)
    expect(resultFormNkdk).toBe(expectedFormNkdk)
    expect(resultFormYaml).toBe(expectedFormYaml)
  })
})
