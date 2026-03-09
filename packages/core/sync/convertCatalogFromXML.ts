import fs from "fs"
import { join } from "path"
import { importMetadataCatalogFromXML } from "~/metadata/appliedObjects/metadataCatalog/fromXML"
import { exportMetadataCatalogToYAML } from "~/metadata/appliedObjects/metadataCatalog/toYAML"
import type { MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"

export const convertCatalogFromXML = async (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  name: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, name: name, outputDir } = params
  const inputPath = join(inputDir, `${name}.xml`)
  const xmlContent = fs.readFileSync(inputPath, "utf-8")

  const result =
    readCatalogFromXML({
      context,
      xml: xmlContent,
    }) ?? ""

  const outputPath = join(outputDir, name)
  fs.mkdirSync(outputPath, { recursive: true })

  const outputFilePath = join(outputPath, "Свойства.yaml")
  fs.writeFileSync(outputFilePath, result, "utf-8")
}

const readCatalogFromXML = (params: { context: ConfigurationContextFromXML; xml: string }): string | undefined => {
  const { context, xml } = params

  const parsed = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(xml)
  const catalog = importMetadataCatalogFromXML(context, parsed.MetaDataObject)

  const yamlObj = exportMetadataCatalogToYAML(context, catalog)
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : undefined

  return yaml
}
