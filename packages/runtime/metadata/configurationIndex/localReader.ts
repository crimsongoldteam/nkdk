import type { ConfigurationIndexBlock, ConfigurationIndexBlockEntity } from "./types"

export interface LocalConfigurationIndexReader {
  entity(logicalAddress: string): ConfigurationIndexBlockEntity | undefined
  entities(): Iterable<ConfigurationIndexBlockEntity>
}

export function createLocalConfigurationIndexReader(
  blocksByProjectPath: ReadonlyMap<string, ConfigurationIndexBlock>,
): LocalConfigurationIndexReader {
  const entities = new Map<string, ConfigurationIndexBlockEntity>()
  for (const [projectPath, block] of blocksByProjectPath) {
    for (const entity of block.entities) {
      if (entities.has(entity.logicalAddress)) {
        throw new Error(`logicalAddress ${entity.logicalAddress} присутствует в нескольких загруженных блоках, включая ${projectPath}`)
      }
      entities.set(entity.logicalAddress, structuredClone(entity))
    }
  }
  return {
    entity(logicalAddress) {
      return entities.get(logicalAddress)
    },
    *entities() {
      yield* entities.values()
    },
  }
}
