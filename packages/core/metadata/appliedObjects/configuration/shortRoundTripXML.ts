import fs from "fs"
import { basename, join } from "path"
import {
  readCatalogChildNamesFromXML,
  readCatalogFromXML,
} from "~/metadata/appliedObjects/metadataCatalog/convertFromXML"
import { exportMetadataCatalogToXML } from "~/metadata/appliedObjects/metadataCatalog/toXML"
import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { readFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import { xmlExport } from "~/xml/export/exporter"

const makeContextFromXML = (): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference: true },
})

const makeContextToXML = (
  parentName: string,
  forms: string[] = [],
  templates: string[] = []
): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: {
    itemsTree: [],
    configDumpInfo: new Map(),
    version: "2.20",
    context: {
      forms,
      templates,
      parentName,
      metadataForNumbering: [],
    },
  },
})

export const shortRoundTripXML = async (params: { inputDir: string; outputDir: string }): Promise<void> => {
  const { inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return
  }

  const catalogsInputDir = join(inputDir, "Catalogs")
  const catalogsOutputDir = join(outputDir, "Catalogs")

  const entries = fs.readdirSync(catalogsInputDir, { withFileTypes: true })
  const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

  for (const entry of xmlFiles) {
    const catalogName = basename(entry.name, ".xml")

    try {
      const catalog = readCatalogFromXML({
        context: makeContextFromXML(),
        inputDir: catalogsInputDir,
        catalogName,
      })

      const { forms: formNames, templates: templateNames } = readCatalogChildNamesFromXML(
        join(catalogsInputDir, `${catalogName}.xml`)
      )

      const xmlObj = exportMetadataCatalogToXML({
        context: makeContextToXML(catalogName, formNames, templateNames),
        data: catalog,
        referenceData: catalog,
      })

      if (xmlObj) {
        fs.mkdirSync(catalogsOutputDir, { recursive: true })
        fs.writeFileSync(join(catalogsOutputDir, `${catalogName}.xml`), xmlExport({ MetaDataObject: xmlObj }), "utf-8")
      }
    } catch (err) {
      console.error(`Ошибка round-trip каталога "${catalogName}":`, err)
    }

    const formsInputDir = join(catalogsInputDir, catalogName, "Forms")
    if (!fs.existsSync(formsInputDir)) {
      continue
    }

    const formEntries = fs.readdirSync(formsInputDir, { withFileTypes: true })
    const formXmlFiles = formEntries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

    for (const formEntry of formXmlFiles) {
      const formName = basename(formEntry.name, ".xml")

      const formExtPath = join(formsInputDir, formName, "Ext", "Form.xml")
      if (!fs.existsSync(formExtPath)) continue

      try {
        const form = readFormFromXML({
          context: makeContextFromXML(),
          inputDir: formsInputDir,
          formName,
        })

        const formContextToXML = makeContextToXML(catalogName)

        const formXML = exportClientApplicationFormToXML({
          context: formContextToXML,
          form,
          referenceForm: form,
        })

        const metadataXML = exportFormMetadataToXML({
          context: formContextToXML,
          form,
          referenceForm: form,
          name: formName,
        })

        const formsOutputDir = join(catalogsOutputDir, catalogName, "Forms")
        const formExtOutputDir = join(formsOutputDir, formName, "Ext")
        fs.mkdirSync(formExtOutputDir, { recursive: true })

        fs.writeFileSync(join(formsOutputDir, `${formName}.xml`), xmlExport({ MetaDataObject: metadataXML }), "utf-8")
        fs.writeFileSync(join(formExtOutputDir, "Form.xml"), xmlExport({ Form: formXML }), "utf-8")
      } catch (err) {
        console.error(`Ошибка round-trip формы "${catalogName}/${formName}":`, err)
      }
    }
  }
}
