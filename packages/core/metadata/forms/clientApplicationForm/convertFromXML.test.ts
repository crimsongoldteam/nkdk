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

  it("должен экспортировать текст запроса DynamicList во внешний .query файл", async () => {
    const dynamicListFormName = "withDynamicList"
    const attributeName = "ПроизвольныйЗапросМинимум"
    const expectedQueryText =
      "ВЫБРАТЬ\n\tСправочник1.Ссылка КАК Ссылка,\n\tСправочник1.Наименование КАК Наименование,\n\tСправочник1.Код КАК Код\nИЗ\n\tСправочник.Справочник1 КАК Справочник1"

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir,
      formName: dynamicListFormName,
      outputDir,
    })

    const formOutputPath = join(outputDir, "Формы", dynamicListFormName)
    const yaml = fs.readFileSync(join(formOutputPath, "Форма.yaml"), "utf-8")

    expect(yaml).not.toContain("ТекстЗапроса:")
    expect(yaml).not.toContain("ПроизвольныйЗапрос:")

    const queryPath = join(formOutputPath, "ДинамическийСписок", `${attributeName}.query`)
    expect(fs.existsSync(queryPath)).toBe(true)
    expect(fs.readFileSync(queryPath, "utf-8")).toBe(expectedQueryText)
  })
})
