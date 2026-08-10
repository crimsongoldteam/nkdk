import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { getXMLFixtureDir } from "../../../tests/readFixtureXML"
import { prepareYamlFiles } from "../../project/prepareYamlFiles"
import { writePreparedFormToXML } from "./syncToXML"

describe("writePreparedFormToXML", () => {
  it("пишет managed form из подготовленного YAML после удаления исходного файла", async () => {
    const inputDir = getXMLFixtureDir(import.meta.url, "sync/yaml")
    const formName = "ФормаЭлемента"
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-prepared-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const outputDir = join(tmpRoot, "xml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      const projectPath = `Справочник/Товары/Формы/${formName}/Форма.yaml`
      const filePath = join(tmpInputDir, "Формы", formName, "Форма.yaml")
      const prepared = prepareYamlFiles({
        files: [
          {
            projectPath,
            filePath,
            role: "form",
            owner: { dir: "Справочник", name: "Товары" },
            itemType: "ClientApplicationForm",
          },
        ],
        itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
      })
      fs.rmSync(filePath)

      await writePreparedFormToXML({
        context: mockContextToXML(),
        preparedYamlFile: prepared.yamlFiles[0]!,
        outputDir,
        formName,
      })

      expect(fs.existsSync(join(outputDir, "Forms", `${formName}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})
