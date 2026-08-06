import fs from "node:fs"

export function createTestFileLifecycleReporter(outputPath) {
  const testFiles = new Map()
  let packageSetupDuration = 0

  return {
    onTestModuleEnd(testModule) {
      const diagnostic = testModule.diagnostic()
      assertLifecycleDiagnostic(testModule.moduleId, diagnostic, testFiles)
      packageSetupDuration += diagnostic.setupDuration
      testFiles.set(testModule.moduleId, {
        file: testModule.moduleId,
        duration: diagnostic.duration,
      })
    },
    onTestRunEnd() {
      fs.writeFileSync(outputPath, `${JSON.stringify({ packageSetupDuration, testFiles: [...testFiles.values()] })}\n`)
    },
  }
}

function assertLifecycleDiagnostic(moduleId, diagnostic, testFiles) {
  if (typeof moduleId !== "string" || moduleId === "" || testFiles.has(moduleId) ||
    diagnostic === null || typeof diagnostic !== "object") {
    throw new Error("Vitest вернул повреждённую lifecycle-диагностику")
  }
  for (const field of ["setupDuration", "collectDuration", "duration"]) {
    const value = diagnostic[field]
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error("Vitest вернул повреждённую lifecycle-диагностику")
    }
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
