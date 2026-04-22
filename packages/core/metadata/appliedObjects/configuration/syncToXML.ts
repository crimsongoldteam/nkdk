import fs from "fs"
import { join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { ConfigurationSyncResult } from "./convertFromXML"

// TODO: вынести в настройки расширения
const IO_CONCURRENCY = 64

export const syncConfigurationToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [] }
  }

  const catalogsDir = join(inputDir, "Справочник")

  // Discovery phase: параллельно читаем список каталогов и их форм
  const entries = await fs.promises.readdir(catalogsDir, { withFileTypes: true })
  const catalogDirEntries = entries.filter((e) => e.isDirectory())

  const discoveries = await Promise.all(
    catalogDirEntries.map(async (entry) => {
      const name = entry.name
      const propertiesPath = join(catalogsDir, name, "Свойства.yaml")
      if (!fs.existsSync(propertiesPath)) return null

      const formsDir = join(catalogsDir, name, "Формы")
      if (!fs.existsSync(formsDir)) return { name, formNames: [] }

      const formEntries = await fs.promises.readdir(formsDir, { withFileTypes: true })
      const formNames = formEntries
        .filter((e) => e.isDirectory())
        .filter((e) => {
          const formYamlPath = join(formsDir, e.name, "Форма.yaml")
          const formNkdkPath = join(formsDir, e.name, "Форма.nkdk")
          return fs.existsSync(formYamlPath) && fs.existsSync(formNkdkPath)
        })
        .map((e) => e.name)
      return { name, formNames }
    }),
  )

  // Собираем flat-список задач (каталоги и формы равноправно)
  const tasks: BatchTask<void>[] = []
  for (const discovery of discoveries) {
    if (discovery === null) continue
    const { name, formNames } = discovery

    const catalogOutputDir = join(outputDir, "Catalogs")
    const catalogReferenceDir = join(referenceDir, "Catalogs")

    tasks.push({
      kind: "catalog",
      name,
      run: () =>
        syncAppliedObjectToXML({
          rule: MetadataCatalogRules,
          context: { ...context, exportToXML: { ...context.exportToXML } },
          inputDir: catalogsDir,
          name,
          outputDir: catalogOutputDir,
          referenceDir: catalogReferenceDir,
        }),
    })

    const catalogPath = join(catalogsDir, name)
    const formOutputDir = join(outputDir, "Catalogs", name)
    const formReferenceDir = join(referenceDir, "Catalogs", name, "Forms")

    for (const formName of formNames) {
      tasks.push({
        kind: "form",
        name: formName,
        parent: name,
        run: () =>
          syncFormToXML({
            context,
            inputDir: catalogPath,
            formName,
            outputDir: formOutputDir,
            referenceDir: formReferenceDir,
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
