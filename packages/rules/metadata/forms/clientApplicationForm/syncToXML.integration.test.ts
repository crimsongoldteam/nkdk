import {
  createConfigurationIndexCollector,
  createConfigurationIndexExportRuntime,
  createXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import fs from "fs"
import os from "os"
import { join } from "path"
import { describe,expect,it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { mockContextToXML } from "../../../tests/mockContext"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import { getXMLFixtureDir } from "../../../tests/readFixtureXML"
import { prepareYamlFiles } from "../../project/prepareYamlFiles"
import { prepareFormXML,writePreparedFormToXML } from "./syncToXML"

describe("writePreparedFormToXML", () => {
  it("готовит для обычной формы только metadata XML", () => {
    const prepared = {
      projectPath: "Справочник/Товары/Формы/Обычная/Форма.yaml",
      filePath: "/tmp/Обычная/Форма.yaml",
      role: "form" as const,
      owner: { dir: "Справочник", name: "Товары" },
      data: { ТипФормы: "Обычная" },
      annotations: createXmlAnomalyAnnotations(),
      syntaxDiagnostics: [],
    }

    const result = prepareFormXML({
      context: mockContextToXML(),
      preparedYamlFile: prepared,
      formName: "Обычная",
    })

    expect(result.map(({ targetKind }) => targetKind)).toEqual(["metadata"])
    expect(result[0]?.xml).toHaveProperty("MetaDataObject.Form.Properties.FormType", "Ordinary")
  })

  it("не записывает Form.xml обычной формы", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-ordinary-form-"))
    try {
      await writePreparedFormToXML({
        context: mockContextToXML(),
        preparedYamlFile: {
          projectPath: "Справочник/Товары/Формы/Обычная/Форма.yaml",
          filePath: join(tmpRoot, "project", "Форма.yaml"),
          role: "form",
          owner: { dir: "Справочник", name: "Товары" },
          data: { ТипФормы: "Обычная" },
          annotations: createXmlAnomalyAnnotations(),
          syntaxDiagnostics: [],
        },
        outputDir: join(tmpRoot, "xml"),
        formName: "Обычная",
      })

      expect(fs.existsSync(join(tmpRoot, "xml", "Forms", "Обычная.xml"))).toBe(true)
      expect(fs.existsSync(join(tmpRoot, "xml", "Forms", "Обычная", "Ext", "Form.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("классифицирует таблицу сохранённого BaseForm по текущей форме основной конфигурации", () => {
    const prepared = (data: unknown) => ({
      projectPath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      filePath: "/tmp/Форма.yaml",
      role: "form" as const,
      owner: { dir: "Справочник", name: "Товары" },
      data,
      annotations: createXmlAnomalyAnnotations(),
      syntaxDiagnostics: [],
    })
    const result = prepareFormXML({
      context: mockContextToXML(),
      preparedYamlFile: prepared({ Элементы: { Список: { Вид: "ТаблицаФормы" } } }),
      baseFormPreparedYamlFile: prepared({ Элементы: { Список: { Вид: "ТаблицаФормы" } } }),
      currentConfigurationFormPreparedYamlFile: prepared({
        Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
        Элементы: { Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" } },
      }),
      baseFormSourceKind: "saved",
      baseFormContext: mockContextToXML(),
      formName: "ФормаСписка",
    })
    const body = result.find(({ targetKind }) => targetKind === "body")?.xml as Record<string, any>
    const table = body.Form.BaseForm.ChildItems[0].Table

    expect(table).toMatchObject({ AutoRefresh: false, ShowRoot: true })
  })

  it("назначает один расширенный ID впервые заимствованному реквизиту сохранённого BaseForm", () => {
    const formAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const source = testConfigurationIndexReader()
    const contextWithIndex = (logicalAddress: string, targetProjectPath: string) => {
      const context = mockContextToXML()
      return {
        ...context,
        exportToXML: {
          ...context.exportToXML,
          configurationIndex: createConfigurationIndexExportRuntime({
            source,
            collector: createConfigurationIndexCollector(),
            targetProjectPath,
            logicalAddress,
          }),
        },
      }
    }
    const prepared = (projectPath: string) => ({
      projectPath,
      filePath: `/tmp/${projectPath}`,
      role: "form" as const,
      owner: { dir: "Справочник", name: "Товары" },
      data: { Реквизиты: { Объект: { Тип: "Строка" } } },
      annotations: createXmlAnomalyAnnotations(),
      syntaxDiagnostics: [],
    })

    const result = prepareFormXML({
      context: contextWithIndex(formAddress, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"),
      preparedYamlFile: prepared("Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"),
      baseFormPreparedYamlFile: prepared("Справочник/Товары/Формы/ФормаЭлемента/БазоваяФорма.yaml"),
      currentConfigurationFormPreparedYamlFile: prepared("cf/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"),
      baseFormSourceKind: "saved",
      baseFormContext: contextWithIndex(
        `${formAddress}.ОсноваФормы`,
        "Справочник/Товары/Формы/ФормаЭлемента/БазоваяФорма.yaml",
      ),
      formName: "ФормаЭлемента",
    })
    const body = result.find(({ targetKind }) => targetKind === "body")?.xml as Record<string, any>
    const outerAttribute = body.Form.Attributes.Attribute.find(
      (attribute: Record<string, unknown>) => attribute._name === "Объект",
    )
    const baseAttribute = body.Form.BaseForm.Attributes.Attribute.find(
      (attribute: Record<string, unknown>) => attribute._name === "Объект",
    )

    expect(outerAttribute._id).toBe("1000001")
    expect(baseAttribute._id).toBe("1000001")
  })

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
