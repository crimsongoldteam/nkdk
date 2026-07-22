import { syncConfigurationFromXML } from "@nkdk/core"
import fs from "fs"

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
  await assertImportTargetEmpty(yamlDir)
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

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}

async function assertImportTargetEmpty(yamlDir: string): Promise<void> {
  await fs.promises.mkdir(yamlDir, { recursive: true })
  const entries = await fs.promises.readdir(yamlDir)
  if (entries.length > 0) {
    throw new Error(`YAML-каталог импорта должен быть пустым: ${yamlDir}`)
  }
}
