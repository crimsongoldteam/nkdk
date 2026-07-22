import fs from "fs"
import { dirname, join, resolve } from "path"
import { NKDK_CORE_VERSION } from "../../version"
import { decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import type { ConfigurationIndexData } from "./types"

export const DEFAULT_CONFIGURATION_INDEX_BASE_ID = "default"

export function configurationIndexPath(
  projectDir: string,
  baseId = DEFAULT_CONFIGURATION_INDEX_BASE_ID
): string {
  assertBaseId(baseId)
  return join(resolve(projectDir), ".nkdk", "configuration-index", `${baseId}.bin`)
}

export async function readConfigurationIndex(params: {
  projectDir: string
  baseId?: string
}): Promise<ConfigurationIndexData> {
  const baseId = params.baseId ?? DEFAULT_CONFIGURATION_INDEX_BASE_ID
  const encoded = await fs.promises.readFile(configurationIndexPath(params.projectDir, baseId))
  return decodeConfigurationIndex(encoded, {
    expectedBaseId: baseId,
    expectedProducerVersion: NKDK_CORE_VERSION,
  })
}

export async function writeConfigurationIndexAtomically(params: {
  projectDir: string
  data: ConfigurationIndexData
}): Promise<void> {
  const target = configurationIndexPath(params.projectDir, params.data.binding.baseId)
  const directory = dirname(target)
  await fs.promises.mkdir(directory, { recursive: true })
  await fs.promises.writeFile(target, encodeConfigurationIndex(params.data))
}

function assertBaseId(baseId: string): void {
  if (baseId !== DEFAULT_CONFIGURATION_INDEX_BASE_ID) {
    throw new Error(`Неподдерживаемый baseId индекса конфигурации: ${baseId}`)
  }
}
