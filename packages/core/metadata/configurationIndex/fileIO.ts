import { randomBytes } from "crypto"
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

export async function writeConfigurationIndexAtomically(params: {
  projectDir: string
  address: ComponentAddress
  data: ConfigurationSnapshot
}): Promise<void> {
  const expectedComponentPath = componentPath(params.address)
  if (params.data.componentPath !== expectedComponentPath) {
    throw new Error(`Ожидалась привязка ${expectedComponentPath}, получена ${params.data.componentPath}`)
  }
  const target = configurationIndexPath(params.projectDir, params.address)
  const directory = dirname(target)
  const nonce = randomBytes(8).toString("hex")
  const temporary = join(directory, `.configuration-index.bin.${process.pid}.${nonce}.tmp`)
  await fs.promises.mkdir(directory, { recursive: true })
  try {
    const handle = await fs.promises.open(temporary, "wx")
    try {
      await handle.writeFile(encodeConfigurationIndex(params.data))
      await handle.sync()
    } finally {
      await handle.close()
    }
    await fs.promises.rename(temporary, target)
    const directoryHandle = await fs.promises.open(directory, "r")
    try {
      await directoryHandle.sync()
    } finally {
      await directoryHandle.close()
    }
  } catch (caught) {
    await fs.promises.unlink(temporary).catch(() => undefined)
    throw caught
  }
}
