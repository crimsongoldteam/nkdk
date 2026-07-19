import { syncConfigurationFromXML } from "@nkdk/core"

interface ImportConfigurationDeps {
  syncConfigurationFromXML: typeof syncConfigurationFromXML
}

const defaultImportConfigurationDeps: ImportConfigurationDeps = {
  syncConfigurationFromXML,
}

export const importConfiguration = async (
  xmlDir: string,
  yamlDir: string,
  deps: ImportConfigurationDeps = defaultImportConfigurationDeps,
): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    fromXML: { forReference: false },
  }
  const result = await deps.syncConfigurationFromXML({ context, inputDir: xmlDir, outputDir: yamlDir })

  for (const warning of result.warnings) {
    process.stderr.write(`⚠ ${warning.message}\n`)
  }

  for (const f of result.failed) {
    const label = f.targetProjectPath || f.sourcePath || "Конфигурация"
    process.stderr.write(`✖ ${f.code} "${label}": ${f.message}\n`)
  }

  if (result.preservedTempRoot !== undefined) {
    process.stderr.write(`Временные файлы: ${result.preservedTempRoot}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
