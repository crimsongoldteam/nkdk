import { readFileSync, writeFileSync } from "fs"

export const importCatalog = (inputPath: string, outputPath: string) => {
  const context = {
    defaultLanguage: "ru",
  }

  const xmlContent = readFileSync(inputPath, "utf-8")

  const importedXml = xmlImport<{ MetaDataObject: MetadataCatalogXML }>(xmlContent)

  const exportedEnterprise = exportMetadataCatalogToEnterprise(context, importedXml)

  const yamlString = exportToYAML(exportedEnterprise!)

  writeFileSync(outputPath, yamlString, "utf-8")
}
