import {
  exportMetadataCatalogToEnterprise,
  exportToYAML,
  importContentFromXML,
  importMetadataCatalogFromXML,
  MetadataCatalogXML,
} from "@nakidka/core"

import * as cliProgress from "cli-progress"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

export const importCatalog = (inputPath: string, outputPath: string): void => {
  const context = {
    defaultLanguage: "ru",
  }

  const xmlContent = readFileSync(inputPath, "utf-8")

  const importedXml = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(xmlContent)

  if (!importedXml?.MetaDataObject) {
    throw new Error("Не удалось распарсить XML")
  }

  const catalogData = importMetadataCatalogFromXML(context, importedXml.MetaDataObject)

  if (!catalogData) {
    throw new Error("Не удалось импортировать каталог")
  }

  const exportedEnterprise = exportMetadataCatalogToEnterprise(context, catalogData)

  if (!exportedEnterprise) {
    throw new Error("Не удалось экспортировать каталог")
  }

  const yamlString = exportToYAML(exportedEnterprise)

  writeFileSync(outputPath, yamlString, "utf-8")
}

/**
 * Ищет все XML файлы в каталоге inputPath/Catalogs и обрабатывает их через importCatalog
 * @param inputPath - путь к входящему каталогу
 * @param outputPath - путь к исходящему каталогу
 */
export const importCatalogsFromDirectory = (inputPath: string, outputPath: string) => {
  const catalogsPath = join(inputPath, "Catalogs")

  if (!existsSync(catalogsPath)) {
    return
  }

  const entries = readdirSync(catalogsPath, { withFileTypes: true })
  const xmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

  if (xmlFiles.length === 0) {
    console.log("XML файлы не найдены")
    return
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format: "Импорт каталогов |{bar}| {percentage}% | {value}/{total} файлов | {file}",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  )

  progressBar.start(xmlFiles.length, 0, { file: "" })

  const errors: Array<{ file: string; error: string }> = []
  let processedCount = 0

  try {
    for (let i = 0; i < xmlFiles.length; i++) {
      const entry = xmlFiles[i]
      const inputFile = join(catalogsPath, entry.name)
      const nameWithoutExtension = entry.name.replace(/\.xml$/i, "")
      const outputFilePath = join(outputPath, "Catalogs", nameWithoutExtension)
      const outputFileYmlPath = join(outputFilePath, "Item.yml")
      const fileName = entry.name

      try {
        mkdirSync(outputFilePath, { recursive: true })
        importCatalog(inputFile, outputFileYmlPath)
        processedCount++
      } catch (error) {
        let errorMessage = "Неизвестная ошибка"
        if (error instanceof Error) {
          errorMessage = error.message
          const firstLine = errorMessage.split("\n")[0]
          errorMessage = firstLine.length > 100 ? firstLine.substring(0, 97) + "..." : firstLine
        } else {
          errorMessage = String(error).split("\n")[0]
        }
        errors.push({ file: inputFile, error: errorMessage })
      }

      progressBar.update(i + 1, { file: fileName })
    }
  } finally {
    progressBar.stop()
  }

  console.log("")
  if (errors.length > 0) {
    console.log(`⚠  Обработано: ${processedCount}/${xmlFiles.length} файлов`)
    console.log(`❌ Ошибок: ${errors.length}`)
  } else {
    console.log(`✓ Успешно обработано: ${processedCount}/${xmlFiles.length} файлов`)
  }
}
