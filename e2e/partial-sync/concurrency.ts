export type PlatformMode = "designer-agent" | "standalone-server"
export type ConcurrencySetting = number | "auto"

export type ConcurrencySettings = {
  readonly total: ConcurrencySetting
  readonly designerAgent: ConcurrencySetting
  readonly standaloneServer: ConcurrencySetting
}

export type ResolvedConcurrency = {
  readonly total: number
  readonly designerAgent: number
  readonly standaloneServer: number
}

export type ConcurrencyResources = {
  readonly cpuCount: number
  readonly availableMemoryBytes: number
}

export type SettledJob<R> =
  | { readonly status: "succeeded"; readonly value: R }
  | { readonly status: "failed"; readonly error: Error }

export function resolveConcurrency(
  settings: ConcurrencySettings,
  resources: ConcurrencyResources,
): ResolvedConcurrency {
  const automatic = Math.max(1, Math.min(
    2,
    Math.floor(resources.cpuCount / 2),
    Math.floor(resources.availableMemoryBytes / 2_000_000_000),
  ))
  return {
    total: resolveSetting(settings.total, automatic, "total"),
    designerAgent: resolveSetting(settings.designerAgent, automatic, "designerAgent", true),
    standaloneServer: resolveSetting(settings.standaloneServer, automatic, "standaloneServer", true),
  }
}

export async function runWithConcurrency<T, R>(
  jobs: readonly T[],
  limit: number,
  run: (job: T) => Promise<R>,
): Promise<readonly SettledJob<R>[]> {
  assertPositiveLimit(limit)
  const results = new Array<SettledJob<R>>(jobs.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < jobs.length) {
      const index = next
      next += 1
      results[index] = await settle(() => run(jobs[index]))
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker))
  return results
}

export async function runModeJobsWithConcurrency<T extends { readonly mode: PlatformMode }, R>(
  jobs: readonly T[],
  limits: ResolvedConcurrency,
  run: (job: T) => Promise<R>,
): Promise<readonly SettledJob<R>[]> {
  assertPositiveLimit(limits.total)
  const pending = jobs.map((_, index) => index)
  const results = new Array<SettledJob<R>>(jobs.length)
  const runningByMode: Record<PlatformMode, number> = {
    "designer-agent": 0,
    "standalone-server": 0,
  }
  let running = 0

  await new Promise<void>((resolve, reject) => {
    const pump = () => {
      while (running < limits.total) {
        const pendingOffset = pending.findIndex((index) =>
          runningByMode[jobs[index].mode] < modeLimit(limits, jobs[index].mode))
        if (pendingOffset < 0) break
        const [index] = pending.splice(pendingOffset, 1)
        const job = jobs[index]
        running += 1
        runningByMode[job.mode] += 1
        void settle(() => run(job)).then((result) => {
          results[index] = result
          running -= 1
          runningByMode[job.mode] -= 1
          pump()
        }, reject)
      }
      if (pending.length === 0 && running === 0) resolve()
      else if (running === 0) reject(new Error("Для оставшихся режимов задан нулевой предел"))
    }
    pump()
  })
  return results
}

function resolveSetting(
  setting: ConcurrencySetting,
  automatic: number,
  name: string,
  allowZero = false,
): number {
  if (setting === "auto") return automatic
  if (!Number.isInteger(setting) || setting < (allowZero ? 0 : 1)) {
    throw new Error(`Недопустимый предел параллельности ${name}: ${setting}`)
  }
  return setting
}

function assertPositiveLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Общий предел параллельности должен быть положительным целым числом")
  }
}

function modeLimit(limits: ResolvedConcurrency, mode: PlatformMode): number {
  return mode === "designer-agent" ? limits.designerAgent : limits.standaloneServer
}

async function settle<R>(run: () => Promise<R>): Promise<SettledJob<R>> {
  try {
    return { status: "succeeded", value: await run() }
  } catch (caught) {
    return { status: "failed", error: caught instanceof Error ? caught : new Error(String(caught)) }
  }
}
