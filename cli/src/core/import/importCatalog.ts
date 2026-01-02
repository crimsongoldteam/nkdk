import {
  exportMetadataCatalogToEnterprise,
  exportToYAML,
  importContentFromXML,
  importMetadataCatalogFromXML,
  MetadataCatalogXML,
} from "@nakidka/core"

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

export const importCatalog = (inputPath: string, outputPath: string) => {
  try {
    const context = {
      defaultLanguage: "ru",
    }

    const xmlContent = readFileSync(inputPath, "utf-8")

    const importedXml = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(xmlContent)

    if (!importedXml?.MetaDataObject) {
      console.error(`Ошибка: не удалось распарсить XML из ${inputPath}`)
      return
    }

    const catalogData = importMetadataCatalogFromXML(context, importedXml.MetaDataObject)

    if (!catalogData) {
      console.error(`Ошибка: не удалось импортировать каталог из ${inputPath}`)
      return
    }

    const exportedEnterprise = exportMetadataCatalogToEnterprise(context, catalogData)

    if (!exportedEnterprise) {
      console.error(`Ошибка: не удалось экспортировать каталог из ${inputPath}`)
      return
    }

    const yamlString = exportToYAML(exportedEnterprise)

    writeFileSync(outputPath, yamlString, "utf-8")
  } catch (error) {
    console.error(`Ошибка при обработке ${inputPath}:`, error instanceof Error ? error.message : String(error))
    // Не прерываем выполнение, продолжаем обработку остальных файлов
  }
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

  for (const entry of xmlFiles) {
    const inputFile = join(catalogsPath, entry.name)
    const nameWithoutExtension = entry.name.replace(/\.xml$/i, "")
    const outputFilePath = join(outputPath, "Catalogs", nameWithoutExtension)
    const outputFileYmlPath = join(outputFilePath, "Item.yml")

    mkdirSync(outputFilePath, { recursive: true })

    importCatalog(inputFile, outputFileYmlPath)
  }
}
