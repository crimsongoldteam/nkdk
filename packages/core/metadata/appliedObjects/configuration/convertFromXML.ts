import fs from "fs"
import { basename, join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

// TODO: вынести в настройки расширения
const IO_CONCURRENCY = 64

export type ConfigurationSyncResult = {
  succeeded: number
  failed: Array<{
    kind: string
    name: string
    parent?: string
    error: Error
  }>
}

export const syncConfigurationFromXML = async (params: {
  context: ConfigurationContextFromXML
  /**
   * Путь к корню XML-выгрузки конфигурации
   */
  inputDir: string
  /**
   * Путь к корню YAML-проекта
   */
  outputDir: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [] }
  }

  const tasks: BatchTask<void>[] = []

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    if (rule.itemTypePrefix === undefined) continue

    const xmlDirAbs = join(inputDir, rule.xmlDir)
    const yamlDirAbs = join(outputDir, rule.itemTypePrefix)
    if (!fs.existsSync(xmlDirAbs)) continue

    const entries = await fs.promises.readdir(xmlDirAbs, { withFileTypes: true })
    const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

    // Формы обрабатываем только если у правила есть свойство типа "ChildFormNames"
    const hasForms = Object.values(rule.properties).some((p) => p.type === "ChildFormNames")

    const formDiscoveries = await Promise.all(
      xmlFiles.map(async (entry) => {
        const name = basename(entry.name, ".xml")
        if (!hasForms) return { name, formsDir: "", formNames: [] as string[] }
        const formsDir = join(xmlDirAbs, name, "Forms")
        if (!fs.existsSync(formsDir)) return { name, formsDir, formNames: [] as string[] }
        const formEntries = await fs.promises.readdir(formsDir, { withFileTypes: true })
        const formNames = formEntries
          .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
          .map((e) => basename(e.name, ".xml"))
        return { name, formsDir, formNames }
      }),
    )

    for (const { name, formsDir, formNames } of formDiscoveries) {
      tasks.push({
        kind: rule.itemType,
        name,
        run: () =>
          convertAppliedObjectFromXML({
            rule,
            context,
            inputDir: xmlDirAbs,
            name,
            outputDir: yamlDirAbs,
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
              outputDir: join(yamlDirAbs, name),
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
