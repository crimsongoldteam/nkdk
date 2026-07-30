import { relative } from "node:path"

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function reportTests(report, projectRoot) {
  return new Map(
    report.testResults.flatMap((suite) =>
      suite.assertionResults.map((test) => {
        const file = relative(projectRoot, suite.name).replace(/\\/gu, "/")
        const id = `${file}::${test.fullName}`
        return [id, {
          id,
          file,
          name: test.fullName,
          durationMs: test.duration ?? 0,
        }]
      })
    )
  )
}

export function collectTestDurationProfile(reports, options) {
  if (reports.length !== 3) throw new Error("Для профиля нужны ровно три отчёта")

  const runs = reports.map((report) => reportTests(report, options.projectRoot))
  const identities = [...runs[0].keys()].sort()
  for (const run of runs.slice(1)) {
    if (JSON.stringify([...run.keys()].sort()) !== JSON.stringify(identities)) {
      throw new Error("Наборы тестов в отчётах различаются")
    }
  }

  return identities
    .map((id) => {
      const tests = runs.map((run) => run.get(id))
      const durationsMs = tests.map(({ durationMs }) => durationMs)
      return {
        id,
        file: tests[0].file,
        name: tests[0].name,
        durationsMs,
        medianMs: median(durationsMs),
        maxMs: Math.max(...durationsMs),
        exceedances: durationsMs.filter((duration) => duration > options.thresholdMs).length,
      }
    })
    .filter(({ exceedances }) => exceedances > 0)
    .sort((left, right) =>
      right.exceedances - left.exceedances ||
      right.medianMs - left.medianMs ||
      left.id.localeCompare(right.id)
    )
}
