import fs from "fs"
import { dirname, join, resolve } from "path"
import { componentPath, type ComponentAddress } from "../components/address"
import { decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import type { ConfigurationSnapshot } from "./types"

export function configurationIndexPath(projectDir: string, address: ComponentAddress): string {
  return join(resolve(projectDir), ".nkdk", "components", componentPath(address), "configuration-index.bin")
}

export async function readConfigurationIndex(params: {
  projectDir: string
  address: ComponentAddress
}): Promise<ConfigurationSnapshot> {
  const expectedComponentPath = componentPath(params.address)
  const encoded = await fs.promises.readFile(configurationIndexPath(params.projectDir, params.address))
  return decodeConfigurationIndex(encoded, { expectedComponentPath })
}

export async function writeConfigurationIndex(params: {
  projectDir: string
  address: ComponentAddress
  data: ConfigurationSnapshot
}): Promise<void> {
  const expectedComponentPath = componentPath(params.address)
  if (params.data.componentPath !== expectedComponentPath) {
    throw new Error(`Ожидалась привязка ${expectedComponentPath}, получена ${params.data.componentPath}`)
  }
  const target = configurationIndexPath(params.projectDir, params.address)
  await fs.promises.mkdir(dirname(target), { recursive: true })
  await fs.promises.writeFile(target, encodeConfigurationIndex(params.data))
}
