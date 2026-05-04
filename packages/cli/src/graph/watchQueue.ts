export interface WatchQueueOptions {
  debounceMs: number
  runTask: (filePath: string) => Promise<void>
  onError?: (filePath: string, error: unknown) => void
}

export interface WatchQueue {
  enqueue: (filePath: string) => void
  drain: () => Promise<void>
}

export function createWatchQueue(options: WatchQueueOptions): WatchQueue {
  const pending = new Set<string>()
  let timer: NodeJS.Timeout | undefined
  let running = Promise.resolve()

  const runBatch = (batch: string[]): void => {
    running = running.catch(() => undefined).then(async () => {
      for (const filePath of batch) {
        try {
          await options.runTask(filePath)
        } catch (error) {
          options.onError?.(filePath, error)
        }
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
