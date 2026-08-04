import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { createTestFileLifecycleReporter } from "./test-file-lifecycle-reporter.mjs"

const reportPaths: string[] = []

afterEach(() => {
  for (const path of reportPaths.splice(0)) fs.rmSync(path, { force: true })
})

describe("test file lifecycle reporter", () => {
  it("отделяет общий setup от import и исполнения test file", async () => {
    const outputPath = join(os.tmpdir(), `test-file-lifecycle-${crypto.randomUUID()}.json`)
    reportPaths.push(outputPath)
    const reporter = createTestFileLifecycleReporter(outputPath)
    const firstTestModule = {
      moduleId: "/project/expensive-setup.test.ts",
      diagnostic: () => ({ setupDuration: 400, collectDuration: 300, duration: 500 }),
    }
    const secondTestModule = {
      moduleId: "/project/second.test.ts",
      diagnostic: () => ({ setupDuration: 50, collectDuration: 20, duration: 30 }),
    }

    await reporter.onTestModuleEnd(firstTestModule)
    await reporter.onTestModuleEnd(secondTestModule)
    await reporter.onTestRunEnd()

    expect(JSON.parse(fs.readFileSync(outputPath, "utf8"))).toEqual({
      packageSetupDuration: 450,
      testFiles: [
        { file: "/project/expensive-setup.test.ts", duration: 800 },
        { file: "/project/second.test.ts", duration: 50 },
      ],
    })
  })

  it.each([
    ["отрицательную", { setupDuration: -1, collectDuration: 1, duration: 1 }],
    ["нечисловую", { setupDuration: 1, collectDuration: Number.NaN, duration: 1 }],
  ])("отклоняет %s lifecycle-диагностику", async (_name, diagnostic) => {
    const outputPath = join(os.tmpdir(), `test-file-lifecycle-${crypto.randomUUID()}.json`)
    reportPaths.push(outputPath)
    const reporter = createTestFileLifecycleReporter(outputPath)

    expect(() => reporter.onTestModuleEnd({
      moduleId: "/project/example.test.ts",
      diagnostic: () => diagnostic,
    })).toThrow("lifecycle")
  })
})
