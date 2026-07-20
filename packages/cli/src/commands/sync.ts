import { syncConfigurationToXML } from "@nkdk/core"

export interface SyncConfigurationOptions {
  baseId?: string
  concurrency?: number
}

export const syncConfiguration = async (
  yamlDir: string,
  xmlDir: string,
  options: SyncConfigurationOptions = {},
): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
  const result = await syncConfigurationToXML({
    context,
    yamlDir,
    xmlDir,
    ...(options.baseId === undefined ? {} : { baseId: options.baseId }),
    ...(options.concurrency === undefined ? {} : { concurrency: options.concurrency }),
  })

  for (const f of result.failed) {
    process.stderr.write(`✖ ${f.code}: ${f.message}\n`)
  }
  for (const warning of result.warnings) {
    process.stderr.write(`⚠ ${warning.code}: ${warning.message}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)
  if (result.configurationIndexPath !== undefined) {
    process.stdout.write(`Индекс конфигурации: ${result.configurationIndexPath}\n`)
  }

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
