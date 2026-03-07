import fs from "fs"
import { basename, join } from "path"
import { ConfigurationContext } from "~/metadata/context/types"
import { convertCatalogFromXML } from "./convertCatalogFromXML"
import { convertFormFromXML } from "./convertFormFromXML"

export const syncConfigurationFromXML = async (params: {
  context: ConfigurationContext
  inputDir: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, outputDir } = params
  const catalogsPath = join(inputDir, "Catalogs")

  if (!fs.existsSync(catalogsPath)) {
    return
  }

  const entries = fs.readdirSync(catalogsPath, { withFileTypes: true })
  const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

  for (const entry of xmlFiles) {
    const name = basename(entry.name, ".xml")
    try {
      await convertCatalogFromXML({
        context,
        inputDir: catalogsPath,
        name,
        outputDir,
      })
    } catch (err) {
      console.error(`Ошибка импорта каталога "${name}":`, err)
    }

    const formsDir = join(catalogsPath, name, "Forms")
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
          outputDir: join(outputDir, name),
        })
      } catch (err) {
        console.error(`Ошибка импорта формы "${name}/${formName}":`, err)
      }
    }
  }
}
