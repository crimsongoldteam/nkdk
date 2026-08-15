import {
  runPreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTaskResult,
} from "../metadata/project/preparedYamlProjectWorker"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedWorkerPool,
  type PreparedYamlProjectWorkerPool,
} from "../metadata/project/preparedYamlProjectWorkerPool"
import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"
import { permissiveValidationSchemaCache } from "./permissiveValidationSchemaCache"
import { valueSymbol } from "piscina"

export function createPreparedYamlWorkerTestPool(
  concurrency = 1
): {
  readonly pool: PreparedYamlProjectWorkerPool
  close(): Promise<void>
} {
  const createWorkerPool = createPreparedYamlWorkerThreadPoolFactory()
  const pool = createPreparedYamlProjectWorkerPool({
    concurrency,
    createWorkerPool,
  })

  return {
    pool,
    close: () => pool.close(),
  }
}

export function createPreparedYamlWorkerThreadPoolFactory(): () => PreparedWorkerPool {
  const threadPools = createMockWorkerThreadPoolFactory<
    PreparedYamlProjectWorkerTask,
    PreparedYamlProjectWorkerTaskResult
  >((command) => {
    const movable = command as PreparedYamlProjectWorkerTask & {
      readonly [valueSymbol]?: PreparedYamlProjectWorkerTask
    }
    return runPreparedYamlProjectWorkerTask(movable[valueSymbol] ?? command, {
      createValidationSchemaCache: async () => permissiveValidationSchemaCache,
    })
  })
  return threadPools.factory
}
