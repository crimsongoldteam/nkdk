import fs from "fs"
import { join } from "path"
import { importMetadataCatalogFromXML } from "~/metadata/appliedObjects/metadataCatalog/fromXML"
import { exportMetadataCatalogToYAML } from "~/metadata/appliedObjects/metadataCatalog/toYAML"
import type { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
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

  const catalog = readCatalogFromXML({ context, inputDir, catalogName: name })
  const result = readCatalogFromXMLToYAML({ context, catalog }) ?? ""

  const outputPath = join(outputDir, name)
  fs.mkdirSync(outputPath, { recursive: true })

  const outputFilePath = join(outputPath, "Свойства.yaml")
  fs.writeFileSync(outputFilePath, result, "utf-8")
}

export function readCatalogFromXML(params: {
  context: ConfigurationContextFromXML
  inputDir: string
  catalogName: string
}): MetadataCatalog {
  const { context, inputDir, catalogName } = params
  const inputPath = join(inputDir, `${catalogName}.xml`)

  const xmlContent = fs.readFileSync(inputPath, "utf-8")

  const parsed = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(xmlContent)
  const catalog = importMetadataCatalogFromXML(context, parsed.MetaDataObject)
  return catalog
}

const readCatalogFromXMLToYAML = (params: {
  context: ConfigurationContextFromXML
  catalog: MetadataCatalog
}): string | undefined => {
  const { context, catalog } = params

  const yamlObj = exportMetadataCatalogToYAML(context, catalog)
  const yaml = yamlObj != undefined ? exportToYAML(yamlObj) : undefined

  return yaml
}
