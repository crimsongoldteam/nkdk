import { syncConfigurationFromXML } from "@nakidka/core"

export interface ImportConfigurationOptions {
  validateMetadataTargets?: boolean
}

export const importConfiguration = async (
  xmlDir: string,
  yamlDir: string,
  options: ImportConfigurationOptions = {},
): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false, validateMetadataTargets: options.validateMetadataTargets },
    fromXML: { forReference: false },
  }
  const result = await syncConfigurationFromXML({ context, inputDir: xmlDir, outputDir: yamlDir })

  for (const f of result.failed) {
    const label = f.parent ? `${f.parent}/${f.name}` : f.name
    process.stderr.write(`✖ ${f.kind} "${label}": ${f.error.message}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
