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
    reportPaths.push(outputPath)
    const reporter = createTestFileLifecycleReporter(outputPath)
    const testModule = {
      moduleId: "/project/expensive-setup.test.ts",
      diagnostic: () => ({ setupDuration: 400, collectDuration: 300, duration: 500 }),
    }

    await reporter.onTestModuleEnd(testModule)
    await reporter.onTestRunEnd()

    expect(JSON.parse(fs.readFileSync(outputPath, "utf8"))).toEqual({
      testFiles: [{ file: "/project/expensive-setup.test.ts", duration: 1_200 }],
    })
  })
})
