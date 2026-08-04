import { randomBytes } from "node:crypto"
import fs from "node:fs"
import { basename, dirname, join } from "node:path"

const MAX_TEMPORARY_FILE_ATTEMPTS = 100

export interface AtomicFilePublicationParams {
  readonly target: string
  readonly writeTemporary: (temporary: string) => Promise<void>
  readonly verifyTemporary: (temporary: string) => Promise<void>
}

export async function publishFileAtomically(params: AtomicFilePublicationParams): Promise<void> {
  const directory = dirname(params.target)
  await fs.promises.mkdir(directory, { recursive: true })
  const temporary = await reserveTemporaryFile(directory, basename(params.target))
  try {
    await params.writeTemporary(temporary)
    await params.verifyTemporary(temporary)
    await syncFile(temporary)
    await fs.promises.rename(temporary, params.target)
  } catch (caught) {
    await fs.promises.unlink(temporary).catch(() => undefined)
    throw caught
  }
  await syncDirectoryBestEffort(directory)
}

async function reserveTemporaryFile(directory: string, targetName: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_TEMPORARY_FILE_ATTEMPTS; attempt += 1) {
    const nonce = randomBytes(8).toString("hex")
    const temporary = join(directory, `.${targetName}.${process.pid}.${nonce}.tmp`)
    try {
      const handle = await fs.promises.open(temporary, "wx")
      await handle.close()
      return temporary
    } catch (caught) {
      if (!hasErrorCode(caught, "EEXIST")) throw caught
    }
  }
  throw new Error(`Не удалось создать временный файл за ${MAX_TEMPORARY_FILE_ATTEMPTS} попыток`)
}

async function syncFile(path: string): Promise<void> {
  const handle = await fs.promises.open(path, "r")
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function syncDirectoryBestEffort(directory: string): Promise<void> {
  try {
    const handle = await fs.promises.open(directory, "r")
    try {
      await handle.sync()
    } finally {
      await handle.close()
    }
  } catch {
    // rename — точка фиксации: опубликованный файл уже нельзя безопасно откатить.
  }
}

function hasErrorCode(caught: unknown, code: string): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === code
}
