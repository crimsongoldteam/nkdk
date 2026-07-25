import fs from "fs"
import { dirname, join, resolve } from "path"
import { NKDK_CORE_VERSION } from "../../version"
import { componentPath, type ComponentAddress } from "../components/address"
import { decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import type { ConfigurationIndexData } from "./types"

export function configurationIndexPath(
  projectDir: string,
  address: ComponentAddress
): string {
  return join(resolve(projectDir), ".nkdk", "components", componentPath(address), "configuration-index.bin")
}

export async function readConfigurationIndex(params: {
  projectDir: string
  address: ComponentAddress
}): Promise<ConfigurationIndexData> {
  const expectedComponentPath = componentPath(params.address)
  const encoded = await fs.promises.readFile(configurationIndexPath(params.projectDir, params.address))
  return decodeConfigurationIndex(encoded, {
    expectedComponentPath,
    expectedProducerVersion: NKDK_CORE_VERSION,
  })
}

export async function writeConfigurationIndexAtomically(params: {
  projectDir: string
  address: ComponentAddress
  data: ConfigurationIndexData
}): Promise<void> {
  const expectedComponentPath = componentPath(params.address)
  if (params.data.binding.componentPath !== expectedComponentPath) {
    throw new Error(`Ожидалась привязка ${expectedComponentPath}, получена ${params.data.binding.componentPath}`)
  }
  const target = configurationIndexPath(params.projectDir, params.address)
  const directory = dirname(target)
  await fs.promises.mkdir(directory, { recursive: true })
  await fs.promises.writeFile(target, encodeConfigurationIndex(params.data))
}
