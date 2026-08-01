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
  >((command) => runPreparedYamlProjectWorkerTask(command))
  return threadPools.factory
}
