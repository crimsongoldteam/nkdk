import fs from "fs"
import { join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import {
  applyPendingMigrationFiles,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  detectMigrationConflicts,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  validateAppliedMigrationTarget,
  writeAppliedMigrationsState,
} from "./migrations"
import { pruneXmlByManifest, XmlSyncManifest } from "./migrations/xmlManifest"
import { ConfigurationSyncResult } from "./convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

// TODO: вынести в настройки расширения
const IO_CONCURRENCY = 16

export const syncConfigurationToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  if (!fs.existsSync(inputDir)) {
    return {
      succeeded: 0,
      failed: [{ kind: "configuration", name: inputDir, error: new Error(`YAML-каталог не найден: ${inputDir}`) }],
    }
  }

  const appliedState = readAppliedMigrationsState(outputDir)
  const pendingMigrations = readPendingMigrationEntries(inputDir, appliedState)
  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: context.defaultLanguage,
    version: context.version,
  }
  const referenceState = await collectStructuralStateFromXML({ xmlDir: referenceDir, context: contextFromXML })
  const yamlState = await collectStructuralStateFromYAML({ yamlDir: inputDir, context })
  const migrationResult = applyPendingMigrationFiles(referenceState, pendingMigrations)
  validateAppliedMigrationTarget(migrationResult, yamlState)
  const conflicts = detectMigrationConflicts(migrationResult.state, yamlState)
  if (conflicts.length > 0) {
    const details = conflicts
      .map((c) => `${c.levelPath}: удалено [${c.deleted.join(", ")}], добавлено [${c.added.join(", ")}]`)
      .join("\n")
    return {
      succeeded: 0,
      failed: [{
        kind: "migration",
        name: "Миграции",
        error: new Error(`Найдены возможные переименования:\n${details}\nЗапустите: nkdk generate-migration ${inputDir} ${referenceDir}`),
      }],
    }
  }
  const xmlManifest = new XmlSyncManifest(outputDir)
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

    for (const entry of itemDirs) {
      const name = entry.name
      const propertiesPath = join(yamlDirAbs, name, "Свойства.yaml")
      if (!fs.existsSync(propertiesPath)) continue
      const currentObjectPath = `${rule.itemTypePrefix}.${name}`
      const referencePath = migrationResult.referencePathByCurrentPath.get(currentObjectPath) ?? currentObjectPath
      const referencePathSegments = referencePath.split(".")
      const referenceName = referencePathSegments[referencePathSegments.length - 1]!
      const currentNode = migrationResult.state.nodes.get(currentObjectPath)
      const referenceModel = currentNode && currentNode.referencePath === undefined ? null : undefined
      const xmlExternalOutputDir = join(xmlOutputDir, name)
      const xmlExternalReferenceDir = join(xmlReferenceDir, referenceName)
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
            externalOutputDir: xmlExternalOutputDir,
            referenceDir: xmlReferenceDir,
            externalReferenceDir: xmlExternalReferenceDir,
            referenceName,
            currentObjectPath,
            referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
            referenceModel,
            xmlManifest,
          }),
      })
    }
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  if (batchResult.failed.length === 0) {
    await pruneXmlByManifest({
      xmlRoot: outputDir,
      xmlDirs: TopLevelMetadataItemRules.flatMap((rule) => rule.xmlDir ? [rule.xmlDir] : []),
      expectedFiles: xmlManifest.expectedFiles(),
    })
    writeAppliedMigrationsState(outputDir, {
      applied: [...appliedState.applied, ...migrationResult.appliedFileNames],
    })
  }

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
