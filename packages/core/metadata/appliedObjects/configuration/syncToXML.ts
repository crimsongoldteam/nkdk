import fs from "fs"
import { join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { ConfigurationSyncResult } from "./convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

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

  const tasks: BatchTask<void>[] = []

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    if (rule.itemTypePrefix === undefined) continue

    const yamlDirAbs = join(inputDir, rule.itemTypePrefix)
    const xmlOutputDir = join(outputDir, rule.xmlDir)
    const xmlReferenceDir = join(referenceDir, rule.xmlDir)
    if (!fs.existsSync(yamlDirAbs)) continue

    const entries = await fs.promises.readdir(yamlDirAbs, { withFileTypes: true })
    const itemDirs = entries.filter((e) => e.isDirectory())

    // Формы обрабатываем только если у правила есть свойство типа "ChildFormNames"
    const hasForms = Object.values(rule.properties).some((p) => p.type === "ChildFormNames")

    if (!hasForms) {
      for (const entry of itemDirs) {
        const name = entry.name
        const propertiesPath = join(yamlDirAbs, name, "Свойства.yaml")
        if (!fs.existsSync(propertiesPath)) continue
        tasks.push({
          kind: rule.itemType,
          name,
          run: () =>
            syncAppliedObjectToXML({
              rule,
              context: { ...context, exportToXML: { ...context.exportToXML } },
              inputDir: yamlDirAbs,
              name,
              outputDir: xmlOutputDir,
              referenceDir: xmlReferenceDir,
            }),
        })
      }
      continue
    }

    const discoveries = await Promise.all(
      itemDirs.map(async (entry) => {
        const name = entry.name
        const propertiesPath = join(yamlDirAbs, name, "Свойства.yaml")
        if (!fs.existsSync(propertiesPath)) return null

        const formsDir = join(yamlDirAbs, name, "Формы")
        if (!fs.existsSync(formsDir)) return { name, formNames: [] as string[] }

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

    for (const discovery of discoveries) {
      if (discovery === null) continue
      const { name, formNames } = discovery

      tasks.push({
        kind: rule.itemType,
        name,
        run: () =>
          syncAppliedObjectToXML({
            rule,
            context: { ...context, exportToXML: { ...context.exportToXML } },
            inputDir: yamlDirAbs,
            name,
            outputDir: xmlOutputDir,
            referenceDir: xmlReferenceDir,
          }),
      })

      const itemPath = join(yamlDirAbs, name)
      const formOutputDir = join(xmlOutputDir, name)
      const formReferenceDir = join(xmlReferenceDir, name, "Forms")

      for (const formName of formNames) {
        tasks.push({
          kind: "form",
          name: formName,
          parent: name,
          run: () =>
            syncFormToXML({
              context,
              inputDir: itemPath,
              formName,
              outputDir: formOutputDir,
              referenceDir: formReferenceDir,
            }),
        })
      }
    }
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  return {
    succeeded: batchResult.succeeded,
    failed: batchResult.failed.map((f) => ({
      kind: f.kind,
      name: f.name,
      parent: f.parent,
      error: f.error,
    })),
  }
}
