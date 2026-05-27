import fs from "fs"
import { basename, join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CONFIGURATION_XML_FILE, readConfigurationFromXML, writeConfigurationToYAML } from "./rootIO"
import { MetadataConfigurationRules } from "./rules"
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

  if (fs.existsSync(join(inputDir, CONFIGURATION_XML_FILE))) {
    const configuration = readConfigurationFromXML({ context, inputDir })
    writeConfigurationToYAML({ context, configuration, outputDir })
    await syncRootConfigurationExternalFilesFromXML({ context, inputDir, outputDir })
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

    for (const entry of xmlFiles) {
      const name = basename(entry.name, ".xml")
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

async function syncRootConfigurationExternalFilesFromXML(params: {
  context: ConfigurationContextFromXML
  inputDir: string
  outputDir: string
}): Promise<void> {
  for (const [, propRule] of Object.entries(MetadataConfigurationRules.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalFromXML")
    if (!syncFn) continue
    await syncFn({
      context: params.context,
      rule: propRule,
      xmlDir: params.inputDir,
      nkdkDir: params.outputDir,
    })
  }
}
