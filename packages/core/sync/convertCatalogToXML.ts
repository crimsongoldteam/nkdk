import fs from "fs"
import { join } from "path"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { exportMetadataCatalogToXML } from "~/metadata/appliedObjects/metadataCatalog/toXML"
import type { MetadataCatalogYAML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"

export const convertCatalogToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  name: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, name, outputDir } = params

  const yamlPath = join(inputDir, name, "Свойства.yaml")
  const yamlContent = fs.readFileSync(yamlPath, "utf-8")
  const yamlObj = importFromYAML<MetadataCatalogYAML>(yamlContent)
  const catalog = importMetadataCatalogFromYAML(context, yamlObj, name)

  if (!catalog) {
    return
  }

  // const formsDir = join(inputDir, name, "Формы")
  // const formNames: string[] = []
  // if (fs.existsSync(formsDir)) {
  //   const entries = fs.readdirSync(formsDir, { withFileTypes: true })
  //   for (const e of entries) {
  //     if (e.isDirectory()) formNames.push(e.name)
  //   }
  // }

  const metadataCatalogContext: ConfigurationContextWithExportToXML = {
    ...context,
    context: {
      forms: [""],
      templates: [],
      parentName: name,
    },
  }

  const xmlObj = exportMetadataCatalogToXML(metadataCatalogContext, catalog)
  if (!xmlObj) {
    return
  }

  const catalogsOutDir = join(outputDir, "Catalogs")
  fs.mkdirSync(catalogsOutDir, { recursive: true })
  const outputPath = join(catalogsOutDir, `${name}.xml`)
  const xmlString = xmlExport({ MetaDataObject: xmlObj })
  fs.writeFileSync(outputPath, xmlString, "utf-8")
}
