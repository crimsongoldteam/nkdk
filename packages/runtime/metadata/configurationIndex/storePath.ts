import { resolve, join } from "node:path"
import type { ComponentAddress } from "../components/address"
import { componentPath } from "../components/address"

export const CONFIGURATION_INDEX_SCHEMA_VERSION = 2

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

export function configurationIndexCandidateStoreDescriptor(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly operationId: string
  readonly purpose: "import" | "full" | "partial"
}): ConfigurationIndexStoreDescriptor {
  assertSafeOperationId(params.operationId)
  const dataPath = join(
    resolve(params.projectDir),
    ".nkdk",
    "tmp",
    "configuration-index",
    params.purpose,
    componentPath(params.address),
    `${params.operationId}.lmdb`,
  )
  return {
    dataPath,
    lockPath: `${dataPath}-lock`,
    schemaVersion: CONFIGURATION_INDEX_SCHEMA_VERSION,
  }
}

function assertSafeOperationId(operationId: string): void {
  if (
    operationId.length === 0
    || operationId === "."
    || operationId === ".."
    || operationId.includes("/")
    || operationId.includes("\\")
    || operationId.includes("\0")
  ) {
    throw new Error(`Недопустимый operationId: ${operationId}`)
  }
}
