import fs from "fs"
import { join } from "path"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import type { MetadataCatalog, MetadataCatalogYAML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"
import { MetadataCatalogRules } from "./rules"

export const syncCatalogToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  catalogName: string
  outputDir: string
  referenceDir?: string
}): Promise<void> => {
  const { context, inputDir, catalogName, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  const { yamlContent } = await readCatalogFiles({ inputDir, catalogName })

  const yamlObj = importFromYAML<MetadataCatalogYAML>(yamlContent)
  const catalog = importMetadataCatalogFromYAML(context, yamlObj, catalogName)

  if (!catalog) {
    return
  }

  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: {
      forReference: true,
    },
    defaultLanguage: context.defaultLanguage,
    version: "2.20",
  }

  const referenceXmlPath = join(referenceDir, `${catalogName}.xml`)
  const referenceCatalog = readReferenceCatalog({ context: contextFromXML, xmlPath: referenceXmlPath })

  const formNames = await listSubdirNames(join(inputDir, catalogName, "Формы"))
  const templateNames = await listSubdirNames(join(inputDir, catalogName, "Макеты"))

  const metadataCatalogContext: ConfigurationContextWithExportToXML = {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      context: {
        forms: formNames,
        templates: templateNames,
        parentName: catalogName,
        metadataForNumbering: [],
      },
    },
  }

  const xmlObj = exportMetadataItemToXML({
    context: metadataCatalogContext,
    data: catalog,
    referenceData: referenceCatalog,
    rule: MetadataCatalogRules,
  })

  if (!xmlObj) {
    return
  }

  await writeCatalogToXML({ metadataXML: xmlObj, catalogName, outputDir })
}

async function readCatalogFiles(params: { inputDir: string; catalogName: string }): Promise<{
  yamlContent: string
}> {
  const { inputDir, catalogName } = params
  const yamlPath = join(inputDir, catalogName, "Свойства.yaml")
  const yamlContent = await fs.promises.readFile(yamlPath, "utf-8")
  return { yamlContent }
}

function readReferenceCatalog(params: {
  context: ConfigurationContextFromXML
  xmlPath: string
}): MetadataCatalog | undefined {
  const { context, xmlPath } = params
  if (!fs.existsSync(xmlPath)) return undefined
  const xmlContent = fs.readFileSync(xmlPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)
  return importMetadataItemFromXML({ context, xml: parsed.MetaDataObject, rule: MetadataCatalogRules }) ?? undefined
}

const listSubdirNames = async (dir: string): Promise<string[]> => {
  if (!fs.existsSync(dir)) return []
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

const writeCatalogToXML = async (params: {
  metadataXML: Record<string, unknown>
  catalogName: string
  outputDir: string
}): Promise<void> => {
  const { metadataXML, catalogName, outputDir } = params

  const catalogMetadataPath = join(outputDir, `${catalogName}.xml`)

  await fs.promises.mkdir(outputDir, { recursive: true })
  await fs.promises.writeFile(catalogMetadataPath, xmlExport(metadataXML), "utf-8")
}
