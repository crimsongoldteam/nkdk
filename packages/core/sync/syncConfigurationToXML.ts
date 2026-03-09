import fs from "fs"
import { join } from "path"
import { importConfigDumpInfoFromXML } from "~/metadata/appliedObjects/configDumpInfo/fromXML"
import { ConfigDumpInfo, ConfigDumpInfoXML } from "~/metadata/appliedObjects/configDumpInfo/types"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import importContentFromXML from "~/xml/import/importer"
import { convertCatalogToXML } from "./syncCatalogToXML"
import { type ParseFormFromNkdK } from "./syncFormToXML"

export const syncConfigurationToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  parseNkdK?: ParseFormFromNkdK
}): Promise<void> => {
  const { context, inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return
  }

  const configDumpInfo = await syncConfigDumpInfoInfoFromXML({ context, inputDir })

  const entries = fs.readdirSync(inputDir, { withFileTypes: true })
  const catalogDirs = entries.filter((e) => e.isDirectory())

  for (const entry of catalogDirs) {
    const contextWithConfigDumpInfo: ConfigurationContextWithExportToXML = {
      ...context,
      exportToXML: {
        ...context.exportToXML,
        configDumpInfo,
      },
    }

    const name = entry.name
    const catalogPath = join(inputDir, name)
    const propertiesPath = join(catalogPath, "Свойства.yaml")

    if (!fs.existsSync(propertiesPath)) {
      continue
    }

    // try {
    await convertCatalogToXML({
      context: contextWithConfigDumpInfo,
      inputDir,
      name,
      outputDir,
    })
    // } catch (err) {
    //   console.error(`Ошибка экспорта каталога "${name}":`, err)
    // }

    //   const formsDir = join(catalogPath, "Формы")
    //   if (!fs.existsSync(formsDir)) {
    //     continue
    //   }

    //   const formEntries = fs.readdirSync(formsDir, { withFileTypes: true })
    //   const formDirs = formEntries.filter((e) => e.isDirectory())

    //   for (const formEntry of formDirs) {
    //     const formName = formEntry.name
    //     const formYamlPath = join(formsDir, formName, "Форма.yaml")
    //     const formNkdkPath = join(formsDir, formName, "Форма.nkdk")
    //     if (!fs.existsSync(formYamlPath) || !fs.existsSync(formNkdkPath)) {
    //       continue
    //     }
    //     try {
    //       await convertFormToXML({
    //         context,
    //         inputDir: catalogPath,
    //         formName,
    //         outputDir: join(outputDir, "Catalogs", name),
    //         parseNkdK,
    //       })
    //     } catch (err) {
    //       console.error(`Ошибка экспорта формы "${name}/${formName}":`, err)
    //     }
    //   }
  }
}

const syncConfigDumpInfoInfoFromXML = (params: {
  context: ConfigurationContext
  inputDir: string
}): Promise<ConfigDumpInfo> => {
  const { context, inputDir } = params

  const dumpInfoPath = join(inputDir, "ConfigDumpInfo.xml")
  if (!fs.existsSync(dumpInfoPath)) {
    return Promise.resolve(new Map<string, { children: Map<string, string>; id: string; configVersion: string }>())
  }
  const xmlContent = fs.readFileSync(dumpInfoPath, "utf-8")
  const xml = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(xmlContent)

  const result = importConfigDumpInfoFromXML({ context, xml: xml.ConfigDumpInfo })
  return Promise.resolve(result)
}
