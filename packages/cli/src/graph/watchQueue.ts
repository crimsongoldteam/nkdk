export interface WatchQueueOptions {
  debounceMs: number
  runTask: (filePaths: string[]) => Promise<void>
  onError?: (filePaths: string[], error: unknown) => void
}

export interface WatchQueue {
  enqueue: (filePath: string) => void
  enqueueMany: (filePaths: readonly string[]) => void
  drain: () => Promise<void>
}

export function createWatchQueue(options: WatchQueueOptions): WatchQueue {
  const pending = new Set<string>()
  let timer: NodeJS.Timeout | undefined
  let running = Promise.resolve()

  const runBatch = (batch: string[]): void => {
    if (batch.length === 0) return

    running = running.catch(() => undefined).then(async () => {
      try {
        await options.runTask(batch)
      } catch (error) {
        options.onError?.(batch, error)
      }
    })
  }

  const schedule = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      const batch = [...pending]
      pending.clear()
      runBatch(batch)
    }, options.debounceMs)
  }

  return {
    enqueue(filePath: string): void {
      pending.add(filePath)
      schedule()
    },
    enqueueMany(filePaths: readonly string[]): void {
      for (const filePath of filePaths) pending.add(filePath)
      schedule()
    },
    async drain(): Promise<void> {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      const batch = [...pending]
      pending.clear()
      runBatch(batch)
      await running
    },
  }
}
