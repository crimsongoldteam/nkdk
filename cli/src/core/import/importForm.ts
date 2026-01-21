import {
  ClientApplicationFormXML,
  exportClientApplicationFormToEnterprise,
  exportClientApplicationFormToStructure,
  exportToYAML,
  FormMetadataXML,
  importClientApplicationFormFromXML,
  importContentFromXML,
} from "@nakidka/core"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Ищет все XML файлы в каталоге inputPath/Forms и создает для каждого пустой файл Form.yaml
 * @param inputPath - путь к входящему каталогу
 * @param outputPath - путь к исходящему каталогу
 */
export const importForms = (inputPath: string, outputPath: string) => {
  const formsPath = join(inputPath, "Forms")

  if (!existsSync(formsPath)) {
    return
  }

  const entries = readdirSync(formsPath, { withFileTypes: true })
  const xmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

  if (xmlFiles.length === 0) {
    return
  }

  for (const entry of xmlFiles) {
    const name = entry.name.replace(/\.xml$/i, "")
    try {
      importForm(formsPath, name, outputPath)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`❌ Ошибка при обработке формы ${name}: ${errorMessage}`)
    }
  }
}

const importForm = (path: string, name: string, outputPath: string) => {
  const context = {
    defaultLanguage: "ru",
  }

  // Проверяем оба возможных пути к Form.xml
  let formPath = join(path, name, "Ext", "Form.xml")
  if (!existsSync(formPath)) {
    formPath = join(path, name, "Form.xml")
  }

  if (!existsSync(formPath)) {
    console.log(`⚠  Форма ${name}: файл Form.xml не найден`)
    return
  }

  const formXml = readFileSync(formPath, "utf-8")
  const formXmlData = importContentFromXML<{ Form: ClientApplicationFormXML }>(formXml)

  const formMetadataPath = join(path, name + ".xml")
  if (!existsSync(formMetadataPath)) {
    console.log(`⚠  Форма ${name}: файл метаданных не найден`)
    return
  }

  const formMetadataXml = readFileSync(formMetadataPath, "utf-8")
  const formMetadataXmlData = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(formMetadataXml)

  try {
    const formData = importClientApplicationFormFromXML(context, formXmlData.Form, formMetadataXmlData.MetaDataObject)

    if (!formData) {
      console.log(`⚠  Форма ${name}: не удалось импортировать данные формы`)
      return
    }

    const formYaml = exportClientApplicationFormToEnterprise(context, formData)
    if (!formYaml) {
      console.log(`⚠  Форма ${name}: не удалось экспортировать форму в Enterprise формат`)
      return
    }

    const formYamlString = exportToYAML(formYaml)
    if (!formYamlString || formYamlString.trim().length === 0) {
      console.log(`⚠  Форма ${name}: результат экспорта в YAML пустой`)
      return
    }

    const outputFormDir = join(outputPath, "Формы", name)
    mkdirSync(outputFormDir, { recursive: true })
    writeFileSync(join(outputFormDir, `Форма.yaml`), formYamlString, "utf-8")

    const formStructuredObject = exportClientApplicationFormToStructure(context, formData)
    if (formStructuredObject) {
      writeFileSync(join(outputFormDir, "Форма.nkdk"), formStructuredObject.strings.join("\n"), "utf-8")
    }
  } catch (error) {
    // const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`❌ Ошибка при импорте формы ${name}: ${String(error)}`)
  }
}
