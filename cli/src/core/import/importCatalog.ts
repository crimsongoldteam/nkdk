import {
  exportMetadataCatalogToEnterprise,
  exportToYAML,
  importContentFromXML,
  MetadataCatalogXML,
} from "@nakidka/core"

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"

export const importCatalog = (inputPath: string, outputPath: string) => {
  const context = {
    defaultLanguage: "ru",
  }

  const xmlContent = readFileSync(inputPath, "utf-8")

  const importedXml = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(xmlContent)

  const exportedEnterprise = exportMetadataCatalogToEnterprise(context, importedXml)

  const yamlString = exportToYAML(exportedEnterprise!)

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

  for (const entry of xmlFiles) {
    const inputFile = join(catalogsPath, entry.name)
    const outputFileName = entry.name.replace(/\.xml$/i, ".yml")
    const outputFile = join(outputPath, "Catalogs", outputFileName)

    // Создаем директорию для выходного файла, если она не существует
    mkdirSync(dirname(outputFile), { recursive: true })

    importCatalog(inputFile, outputFile)
  }
}
