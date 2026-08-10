import type {
  ConfigurationProjectFile,
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  MergedConfigurationSnapshotFragments,
} from "@nkdk/runtime"
import type { ProjectLogicalAddressEntry } from "../projectDefinition/componentIndexFacts"

export function buildXmlSyncConfigurationSnapshot(params: {
  readonly previous: ConfigurationSnapshot
  readonly currentFiles: readonly ConfigurationProjectFile[]
  readonly currentLogicalAddresses: readonly ProjectLogicalAddressEntry[]
  readonly fragmentData: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshot {
  const files = [...params.currentFiles]
  const currentProjectPaths = new Set(files.map(({ projectPath }) => projectPath))
  assertLogicalAddressProjection(params.currentLogicalAddresses, currentProjectPaths)
  return {
    specificationVersion: params.previous.specificationVersion,
    indexGeneration: params.previous.indexGeneration + 1n,
    componentPath: params.previous.componentPath,
    files,
    entities: replaceSnapshotEntities({
      previous: params.previous.entities.filter(({ sourceProjectPath }) =>
        currentProjectPaths.has(sourceProjectPath)
      ),
      replacements: params.fragmentData,
    }),
  }
}

export function replaceSnapshotEntities(params: {
  readonly previous: readonly ConfigurationSnapshotEntity[]
  readonly replacements: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshotEntity[] {
  const replacedPaths = new Set(params.replacements.sourceProjectPaths)
  const entities = [
    ...params.previous.filter(({ sourceProjectPath }) => !replacedPaths.has(sourceProjectPath)),
    ...params.replacements.entities,
  ]
  const logicalAddresses = new Set<string>()
  for (const entity of entities) {
    if (logicalAddresses.has(entity.logicalAddress)) {
      throw new Error(`Повторный logicalAddress в снимке конфигурации: ${entity.logicalAddress}`)
    }
    logicalAddresses.add(entity.logicalAddress)
  }
  return entities.sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
}

function assertLogicalAddressProjection(
  logicalAddresses: readonly ProjectLogicalAddressEntry[],
  currentProjectPaths: ReadonlySet<string>,
): void {
  const seen = new Set<string>()
  for (const entry of logicalAddresses) {
    if (!currentProjectPaths.has(entry.sourceProjectPath)) {
      throw new Error(`Логический адрес относится к отсутствующему файлу: ${entry.sourceProjectPath}`)
    }
    if (seen.has(entry.logicalAddress)) {
      throw new Error(`Повторный logicalAddress в текущей проекции: ${entry.logicalAddress}`)
    }
    seen.add(entry.logicalAddress)
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
