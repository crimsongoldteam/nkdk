import { resolve, join } from "node:path"
import type { ComponentAddress } from "../components/address"
import { componentPath } from "../components/address"

export const CONFIGURATION_INDEX_SCHEMA_VERSION = 1

export interface ConfigurationIndexStoreDescriptor {
  readonly dataPath: string
  readonly lockPath: string
  readonly schemaVersion: number
}

export function configurationIndexStoreDescriptor(
  projectDir: string,
  address: ComponentAddress,
): ConfigurationIndexStoreDescriptor {
  const dataPath = join(
    resolve(projectDir),
    ".nkdk",
    "components",
    componentPath(address),
    "configuration-index.lmdb",
  )
  return {
    dataPath,
    lockPath: `${dataPath}-lock`,
    schemaVersion: CONFIGURATION_INDEX_SCHEMA_VERSION,
  }
}
