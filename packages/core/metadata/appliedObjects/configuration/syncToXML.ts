import fs from "fs"
import { join } from "path"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { syncCatalogToXML } from "../metadataCatalog/syncToXML"

export const syncConfigurationToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<void> => {
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  if (!fs.existsSync(inputDir)) {
    return
  }

  const catalogsDir = join(inputDir, "Справочник")

  const entries = fs.readdirSync(catalogsDir, { withFileTypes: true })
  const catalogDirs = entries.filter((e) => e.isDirectory())

  for (const entry of catalogDirs) {
    const contextWithConfigDumpInfo: ConfigurationContextWithExportToXML = {
      ...context,
      exportToXML: {
        ...context.exportToXML,
      },
    }

    const name = entry.name
    const catalogPath = join(catalogsDir, name)
    const propertiesPath = join(catalogPath, "Свойства.yaml")

    const catalogOutputDir = join(outputDir, "Catalogs")
    const catalogReferenceDir = join(referenceDir, "Catalogs")

    if (!fs.existsSync(propertiesPath)) {
      continue
    }

    // try {
    await syncCatalogToXML({
      context: contextWithConfigDumpInfo,
      inputDir: catalogsDir,
      catalogName: name,
      outputDir: catalogOutputDir,
      referenceDir: catalogReferenceDir,
    })
    // } catch (err) {
    //   console.error(`Ошибка экспорта каталога "${name}":`, err)
    // }

    const formsDir = join(catalogPath, "Формы")
    if (!fs.existsSync(formsDir)) {
      continue
    }

    const formEntries = fs.readdirSync(formsDir, { withFileTypes: true })
    const formDirs = formEntries.filter((e) => e.isDirectory())

    for (const formEntry of formDirs) {
      const formName = formEntry.name
      const formYamlPath = join(formsDir, formName, "Форма.yaml")
      const formNkdkPath = join(formsDir, formName, "Форма.nkdk")
      if (!fs.existsSync(formYamlPath) || !fs.existsSync(formNkdkPath)) {
        continue
      }

      const formOutputDir = join(outputDir, "Catalogs", name)
      const formReferenceDir = join(referenceDir, "Catalogs", name, "Forms")

      try {
        await syncFormToXML({
          context,
          inputDir: catalogPath,
          formName,
          outputDir: formOutputDir,
          referenceDir: formReferenceDir,
        })
      } catch (err) {
        console.error(`Ошибка экспорта формы "${name}/${formName}":`, err)
      }
    }
  }
}

// const syncConfigDumpInfoInfoFromXML = (params: {
//   context: ConfigurationContext
//   inputDir: string
// }): Promise<ConfigDumpInfo> => {
//   const { context, inputDir } = params

//   const dumpInfoPath = join(inputDir, "ConfigDumpInfo.xml")
//   if (!fs.existsSync(dumpInfoPath)) {
//     return Promise.resolve(new Map<string, { children: Map<string, string>; id: string; configVersion: string }>())
//   }
//   const xmlContent = fs.readFileSync(dumpInfoPath, "utf-8")
//   const xml = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(xmlContent)

//   const result = importConfigDumpInfoFromXML({ context, xml: xml.ConfigDumpInfo })
//   return Promise.resolve(result)
// }
