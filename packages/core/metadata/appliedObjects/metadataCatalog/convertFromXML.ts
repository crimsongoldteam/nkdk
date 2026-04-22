import fs from "fs"
import { join } from "path"
import { exportMetadataCatalogToYAML } from "~/metadata/appliedObjects/metadataCatalog/toYAML"
import type { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { MetadataCatalogRules } from "./rules"

export const convertCatalogFromXML = async (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  name: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, name: name, outputDir } = params

  const inputPath = join(inputDir, `${name}.xml`)
  const xmlContent = await fs.promises.readFile(inputPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(xmlContent)
  const catalog = importCatalogFromXML(context, parsed.MetaDataObject)

  const result = readCatalogFromXMLToYAML({ context, catalog }) ?? ""

  const outputPath = join(outputDir, name)
  await fs.promises.mkdir(outputPath, { recursive: true })

  const outputFilePath = join(outputPath, "Свойства.yaml")
  await fs.promises.writeFile(outputFilePath, result, "utf-8")
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
  return importCatalogFromXML(context, parsed.MetaDataObject)
}

function importCatalogFromXML(context: ConfigurationContextFromXML, xml: MetadataCatalogXML): MetadataCatalog {
  const result = importMetadataItemFromXML({
    context,
    xml,
    rule: MetadataCatalogRules,
  })
  if (!result) throw new Error("Failed to import MetadataCatalog from XML")
  return result
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
