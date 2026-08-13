import {
  createLocalConfigurationIndexReader,
  type ConfigurationIndexBlockEntity,
  type LocalConfigurationIndexReader,
} from "@nkdk/runtime"

export const TEST_CONFIGURATION_UUID = "11111111-1111-4111-8111-111111111111"

export function testConfigurationIndexReader(
  entities: readonly ConfigurationIndexBlockEntity[] = [],
): LocalConfigurationIndexReader {
  return createLocalConfigurationIndexReader(
    entities.length === 0 ? new Map() : new Map([["Тест.yaml", { entities }]]),
  )
}
