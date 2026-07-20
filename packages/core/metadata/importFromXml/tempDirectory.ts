import { randomUUID } from "node:crypto"
import { join, resolve } from "node:path"

export function createImportTempRoot(projectDir: string, operationId: string = randomUUID()): string {
  if (!/^[A-Za-z0-9_-]+$/.test(operationId)) throw new Error("Некорректный operationId")
  return join(resolve(projectDir), ".nkdk", "tmp", "import", operationId)
}

export function importWorkerTempDir(tempRoot: string, workerIndex: number): string {
  if (!Number.isSafeInteger(workerIndex) || workerIndex < 0) throw new Error("Некорректный workerIndex")
  return join(tempRoot, `worker-${workerIndex}`)
}
