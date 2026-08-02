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
  it("складывает import и исполнение файла до завершения hooks", async () => {
    const outputPath = join(os.tmpdir(), `test-file-lifecycle-${crypto.randomUUID()}.json`)
    const eventsPath = join(os.tmpdir(), `test-file-lifecycle-${crypto.randomUUID()}.ndjson`)
    reportPaths.push(outputPath)
    reportPaths.push(eventsPath)
    fs.writeFileSync(eventsPath, `${JSON.stringify({
      file: "/project/expensive-setup.test.ts",
      startTime: 100,
      collectedAt: 300,
    })}\n`)
    const previousEventsPath = process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"]
    process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"] = eventsPath
    const reporter = createTestFileLifecycleReporter(outputPath)
    const testModule = {
      moduleId: "/project/expensive-setup.test.ts",
    }

    const originalDateNow = Date.now
    const times = [400, 900]
    Date.now = () => times.shift()!
    try {
      await reporter.onTestModuleStart(testModule)
      await reporter.onTestModuleEnd(testModule)
      await reporter.onTestRunEnd()
    } finally {
      Date.now = originalDateNow
      if (previousEventsPath === undefined) delete process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"]
      else process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"] = previousEventsPath
    }

    expect(JSON.parse(fs.readFileSync(outputPath, "utf8"))).toEqual({
      testFiles: [{ file: "/project/expensive-setup.test.ts", duration: 700 }],
    })
  })
})
