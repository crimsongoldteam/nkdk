import fs from "fs"
import { basename, join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"

// TODO: вынести в настройки расширения
const IO_CONCURRENCY = 64

export type ConfigurationSyncResult = {
  succeeded: number
  failed: Array<{
    kind: "catalog" | "form"
    name: string
    parent?: string
    error: Error
  }>
}

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
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [] }
  }

  const catalogsXMLDir = join(inputDir, "Catalogs")
  const catalogsYAMLDir = join(outputDir, "Справочник")

  // Discovery phase: читаем список каталогов
  const entries = await fs.promises.readdir(catalogsXMLDir, { withFileTypes: true })
  const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

  // Параллельно читаем списки форм для каждого каталога
  const formDiscoveries = await Promise.all(
    xmlFiles.map(async (entry) => {
      const name = basename(entry.name, ".xml")
      const formsDir = join(catalogsXMLDir, name, "Forms")
      if (!fs.existsSync(formsDir)) return { name, formsDir, formNames: [] }
      const formEntries = await fs.promises.readdir(formsDir, { withFileTypes: true })
      const formNames = formEntries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
        .map((e) => basename(e.name, ".xml"))
      return { name, formsDir, formNames }
    }),
  )

  // Собираем flat-список задач (каталоги и формы равноправно)
  const tasks: BatchTask<void>[] = []
  for (const { name, formsDir, formNames } of formDiscoveries) {
    tasks.push({
      kind: "catalog",
      name,
      run: () =>
        convertAppliedObjectFromXML({
          rule: MetadataCatalogRules,
          context,
          inputDir: catalogsXMLDir,
          name,
          outputDir: catalogsYAMLDir,
        }),
    })
    for (const formName of formNames) {
      tasks.push({
        kind: "form",
        name: formName,
        parent: name,
        run: () =>
          convertFormFromXML({
            context,
            inputDir: formsDir,
            formName,
            outputDir: join(catalogsYAMLDir, name),
          }),
      })
    }
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  return {
    succeeded: batchResult.succeeded,
    failed: batchResult.failed.map((f) => ({
      kind: f.kind as "catalog" | "form",
      name: f.name,
      parent: f.parent,
      error: f.error,
    })),
  }
}
