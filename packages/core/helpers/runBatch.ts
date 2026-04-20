import pLimit from "p-limit"

export interface BatchTask<T> {
  kind: string
  name: string
  parent?: string
  sourcePath?: string
  run: () => Promise<T>
}

export interface BatchFailure {
  kind: string
  name: string
  parent?: string
  sourcePath?: string
  error: Error
}

export interface BatchResult<T> {
  succeeded: number
  failed: BatchFailure[]
  results: T[]
}

export async function runBatch<T>(
  tasks: BatchTask<T>[],
  options: { concurrency: number },
): Promise<BatchResult<T>> {
  const limit = pLimit(options.concurrency)

  const settled = await Promise.allSettled(
    tasks.map((task) =>
      limit(async () => {
        const value = await task.run()
        return { task, value }
      }),
    ),
  )

  const results: T[] = []
  const failed: BatchFailure[] = []

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i]!
    if (outcome.status === "fulfilled") {
      results.push(outcome.value.value)
    } else {
      const task = tasks[i]!
      const reason = outcome.reason
      const error = reason instanceof Error ? reason : new Error(String(reason))
      failed.push({
        kind: task.kind,
        name: task.name,
        parent: task.parent,
        sourcePath: task.sourcePath,
        error,
      })
    }
  }

  return { succeeded: results.length, failed, results }
}
