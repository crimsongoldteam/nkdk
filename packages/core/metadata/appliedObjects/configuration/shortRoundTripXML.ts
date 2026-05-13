import fs from "fs"
import { basename, join } from "path"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { readFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { xmlExport } from "~/xml/export/exporter"
import { TopLevelMetadataItemRules } from "./topLevelRules"

const formatUnknownError = (err: unknown): string => {
  if (err instanceof Error) {
    return err.stack ?? err.message
  }

  return String(err)
}

class RoundTripXMLContextError extends Error {
  constructor(message: string, cause: unknown) {
    super(`${message}\n${formatUnknownError(cause)}`)
    this.name = "RoundTripXMLContextError"
  }
}

const makeContextFromXML = (forReference: boolean): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference },
})

const makeContextToXML = (parentName: string): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: {
    itemsTree: [],
    configDumpInfo: new Map(),
    version: "2.20",
    context: {
      forms: [],
      templates: [],
      parentName,
      metadataForNumbering: [],
    },
  },
})

const readMetadataItemXML = (params: {
  itemDir: string
  itemName: string
  forReference: boolean
  rule: (typeof TopLevelMetadataItemRules)[number]
}) => {
  const xmlContent = fs.readFileSync(join(params.itemDir, `${params.itemName}.xml`), "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)

  return importMetadataItemFromXML({
    context: makeContextFromXML(params.forReference),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
}

const roundTripMetadataItemXML = (params: {
  inputDir: string
  outputDir: string
  itemName: string
  rule: (typeof TopLevelMetadataItemRules)[number]
}) => {
  const item = readMetadataItemXML({
    itemDir: params.inputDir,
    itemName: params.itemName,
    forReference: false,
    rule: params.rule,
  })
  const referenceItem = readMetadataItemXML({
    itemDir: params.inputDir,
    itemName: params.itemName,
    forReference: true,
    rule: params.rule,
  })

  const xmlObj = exportMetadataItemToXML({
    context: makeContextToXML(params.itemName),
    data: item,
    referenceData: referenceItem,
    rule: params.rule,
  })

  if (xmlObj) {
    fs.mkdirSync(params.outputDir, { recursive: true })
    fs.writeFileSync(join(params.outputDir, `${params.itemName}.xml`), xmlExport(xmlObj), "utf-8")
  }
}

const roundTripFormsXML = (params: { inputDir: string; outputDir: string; itemName: string; xmlDir: string }) => {
  const formsInputDir = join(params.inputDir, params.itemName, "Forms")
  if (!fs.existsSync(formsInputDir)) {
    return
  }

  const formEntries = fs.readdirSync(formsInputDir, { withFileTypes: true })
  const formXmlFiles = formEntries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

  for (const formEntry of formXmlFiles) {
    const formName = basename(formEntry.name, ".xml")

    const formExtPath = join(formsInputDir, formName, "Ext", "Form.xml")
    if (!fs.existsSync(formExtPath)) continue

    try {
      const form = readFormFromXML({
        context: makeContextFromXML(false),
        inputDir: formsInputDir,
        formName,
      })

      const referenceForm = readFormFromXML({
        context: makeContextFromXML(true),
        inputDir: formsInputDir,
        formName,
      })

      const formContextToXML = makeContextToXML(params.itemName)

      const formXML = exportClientApplicationFormToXML({
        context: formContextToXML,
        form,
        referenceForm,
      })

      const metadataXML = exportFormMetadataToXML({
        context: formContextToXML,
        form,
        referenceForm,
        name: formName,
      })

      const formsOutputDir = join(params.outputDir, params.itemName, "Forms")
      const formExtOutputDir = join(formsOutputDir, formName, "Ext")
      fs.mkdirSync(formExtOutputDir, { recursive: true })

      fs.writeFileSync(join(formsOutputDir, `${formName}.xml`), xmlExport({ MetaDataObject: metadataXML }), "utf-8")
      fs.writeFileSync(join(formExtOutputDir, "Form.xml"), xmlExport({ Form: formXML }), "utf-8")
    } catch (err) {
      throw new RoundTripXMLContextError(`Ошибка round-trip формы "${params.xmlDir}/${params.itemName}/${formName}"`, err)
    }
  }
}

export const shortRoundTripXML = async (params: { inputDir: string; outputDir: string }): Promise<void> => {
  const { inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return
  }

  for (const rule of TopLevelMetadataItemRules) {
    const { xmlDir } = rule
    if (!xmlDir) continue

    const itemsInputDir = join(inputDir, xmlDir)
    if (!fs.existsSync(itemsInputDir)) continue

    const itemsOutputDir = join(outputDir, xmlDir)
    const entries = fs.readdirSync(itemsInputDir, { withFileTypes: true })
    const xmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

    for (const entry of xmlFiles) {
      const itemName = basename(entry.name, ".xml")

      try {
        roundTripMetadataItemXML({
          inputDir: itemsInputDir,
          outputDir: itemsOutputDir,
          itemName,
          rule,
        })
      } catch (err) {
        throw new RoundTripXMLContextError(`Ошибка round-trip объекта "${xmlDir}/${itemName}"`, err)
      }

      roundTripFormsXML({
        inputDir: itemsInputDir,
        outputDir: itemsOutputDir,
        itemName,
        xmlDir,
      })
    }
  }
}
