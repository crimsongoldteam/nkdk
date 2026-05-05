import fs from "fs"
import { basename, join } from "path"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { convertCatalogFromXML } from "../metadataCatalog/convertFromXML"

export const syncConfigurationFromXML = async (params: {
  context: ConfigurationContextFromXML
  /**
   * Путь к каталогу Catalogs
   */
  inputDir: string
  /**
   * Путь к каталогу Справочник
   */
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return
  }

  const catalogsXMLDir = join(inputDir, "Catalogs")
  const catalogsYAMLDir = join(outputDir, "Справочник")

  const entries = fs.readdirSync(catalogsXMLDir, { withFileTypes: true })
  const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

  for (const entry of xmlFiles) {
    const name = basename(entry.name, ".xml")
    try {
      await convertCatalogFromXML({
        context,
        inputDir: catalogsXMLDir,
        name,
        outputDir: catalogsYAMLDir,
      })
    } catch (err) {
      console.error(`Ошибка импорта каталога "${name}":`, err)
    }

    const formsDir = join(catalogsXMLDir, name, "Forms")
    if (!fs.existsSync(formsDir)) {
      continue
    }

    const formEntries = fs.readdirSync(formsDir, { withFileTypes: true })
    const formXmlFiles = formEntries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

    for (const formEntry of formXmlFiles) {
      const formName = basename(formEntry.name, ".xml")
      try {
        await convertFormFromXML({
          context,
          inputDir: formsDir,
          formName,
          outputDir: join(catalogsYAMLDir, name),
        })
      } catch (err) {
        console.error(`Ошибка импорта формы "${name}/${formName}":`, err)
      }
    }
  }
}
