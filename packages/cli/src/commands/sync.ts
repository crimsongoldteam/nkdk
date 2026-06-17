import { syncConfigurationToXML } from "@nakidka/core"

export interface SyncConfigurationOptions {
  referenceDir?: string
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
    inputDir: yamlDir,
    outputDir: xmlDir,
    ...(options.referenceDir ? { referenceDir: options.referenceDir } : {}),
  })

  for (const f of result.failed) {
    const label = f.parent ? `${f.parent}/${f.name}` : f.name
    process.stderr.write(`✖ ${f.kind} "${label}": ${f.error.message}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
