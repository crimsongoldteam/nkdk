export type ShutdownCloser = () => void | Promise<void>

export function createShutdownCoordinator(closers: readonly ShutdownCloser[]) {
  let closing: Promise<void> | undefined
  return {
    shutdown(): Promise<void> {
      closing ??= closeAll(closers)
      return closing
    },
  }
}

async function closeAll(closers: readonly ShutdownCloser[]): Promise<void> {
  const results = await Promise.allSettled(closers.map(async (close) => close()))
  const rejected = results.find((result) => result.status === "rejected")
  if (rejected?.status === "rejected") throw rejected.reason
}
