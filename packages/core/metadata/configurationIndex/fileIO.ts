import { randomUUID } from "crypto"
import fs from "fs"
import { basename, dirname, join, resolve } from "path"
import { NKDK_CORE_VERSION } from "../../version"
import { decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import type { ConfigurationIndexData } from "./types"

export const DEFAULT_CONFIGURATION_INDEX_BASE_ID = "default"

const UNSUPPORTED_DIRECTORY_SYNC_ERROR_CODES = new Set(["EINVAL", "EPERM", "EISDIR", "ENOTSUP"])

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
  const temporary = join(directory, `.${basename(target)}.${randomUUID()}.tmp`)

  try {
    const encoded = encodeConfigurationIndex(params.data)
    const writeHandle = await fs.promises.open(temporary, "wx")
    try {
      await writeHandle.writeFile(encoded)
    } finally {
      await writeHandle.close()
    }

    const verificationHandle = await fs.promises.open(temporary, "r+")
    try {
      decodeConfigurationIndex(await verificationHandle.readFile(), {
        expectedBaseId: params.data.binding.baseId,
        expectedProducerVersion: params.data.binding.producerVersion,
      })
      await verificationHandle.sync()
    } finally {
      await verificationHandle.close()
    }

    await fs.promises.rename(temporary, target)
    await syncDirectoryIfSupported(directory)
  } finally {
    await fs.promises.rm(temporary, { force: true })
  }
}

function assertBaseId(baseId: string): void {
  if (baseId !== DEFAULT_CONFIGURATION_INDEX_BASE_ID) {
    throw new Error(`Неподдерживаемый baseId индекса конфигурации: ${baseId}`)
  }
}

async function syncDirectoryIfSupported(directory: string): Promise<void> {
  try {
    const directoryHandle = await fs.promises.open(directory, "r")
    try {
      await directoryHandle.sync()
    } finally {
      await directoryHandle.close()
    }
  } catch (caught) {
    if (!isUnsupportedDirectorySyncError(caught)) throw caught
  }
}

function isUnsupportedDirectorySyncError(caught: unknown): boolean {
  return (
    typeof caught === "object" &&
    caught !== null &&
    "code" in caught &&
    typeof caught.code === "string" &&
    UNSUPPORTED_DIRECTORY_SYNC_ERROR_CODES.has(caught.code)
  )
}
