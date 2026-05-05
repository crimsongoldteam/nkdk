import { syncConfigurationToXML } from "@nakidka/core"

export const syncConfiguration = async (yamlDir: string, xmlDir: string): Promise<void> => {
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
  const result = await syncConfigurationToXML({ context, inputDir: yamlDir, outputDir: xmlDir })

  for (const f of result.failed) {
    const label = f.parent ? `${f.parent}/${f.name}` : f.name
    process.stderr.write(`✖ ${f.kind} "${label}": ${f.error.message}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
