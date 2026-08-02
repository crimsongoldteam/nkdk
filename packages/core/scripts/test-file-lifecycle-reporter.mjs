import fs from "node:fs"

export function createTestFileLifecycleReporter(outputPath) {
  const testFiles = new Map()

  return {
    onTestModuleEnd(testModule) {
      const diagnostic = testModule.diagnostic()
      testFiles.set(testModule.moduleId, {
        file: testModule.moduleId,
        duration: diagnostic.setupDuration + diagnostic.collectDuration + diagnostic.duration,
      })
    },
    onTestRunEnd() {
      fs.writeFileSync(outputPath, `${JSON.stringify({ testFiles: [...testFiles.values()] })}\n`)
    },
  }
}

const outputPath = process.env["NKDK_TEST_FILE_LIFECYCLE_REPORT"]

export default class TestFileLifecycleReporter {
  constructor() {
    if (outputPath === undefined || outputPath === "") {
      throw new Error("Не указан путь отчёта lifecycle тестовых файлов")
    }
    this.reporter = createTestFileLifecycleReporter(outputPath)
  }

  onTestModuleEnd(testModule) {
    return this.reporter.onTestModuleEnd(testModule)
  }

  onTestRunEnd() {
    return this.reporter.onTestRunEnd()
  }
}
