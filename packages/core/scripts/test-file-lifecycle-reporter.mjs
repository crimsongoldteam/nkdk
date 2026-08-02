import fs from "node:fs"

export function createTestFileLifecycleReporter(outputPath) {
  const eventsPath = process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"]
  const testFiles = new Map()
  const started = new Map()

  return {
    onTestModuleStart(testModule) {
      started.set(testModule.moduleId, Date.now())
    },
    onTestModuleEnd(testModule) {
      const event = findLifecycleEvent(eventsPath, testModule.moduleId)
      const startTime = started.get(testModule.moduleId)
      if (startTime === undefined) {
        throw new Error(`Неполный lifecycle test file: ${testModule.moduleId}`)
      }
      testFiles.set(testModule.moduleId, {
        file: testModule.moduleId,
        duration: event.collectedAt - event.startTime + Date.now() - startTime,
      })
    },
    onTestRunEnd() {
      fs.writeFileSync(outputPath, `${JSON.stringify({ testFiles: [...testFiles.values()] })}\n`)
    },
  }
}

function findLifecycleEvent(eventsPath, file) {
  if (eventsPath === undefined || eventsPath === "") {
    throw new Error("Не указан путь событий lifecycle test file")
  }
  const event = fs.readFileSync(eventsPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .find((candidate) => candidate.file === file && typeof candidate.collectedAt === "number")
  if (event === undefined || typeof event.startTime !== "number" || event.collectedAt < event.startTime) {
    throw new Error(`Не найден полный lifecycle import test file: ${file}`)
  }
  return event
}

const outputPath = process.env["NKDK_TEST_FILE_LIFECYCLE_REPORT"]

export default class TestFileLifecycleReporter {
  constructor() {
    if (outputPath === undefined || outputPath === "") {
      throw new Error("Не указан путь отчёта lifecycle тестовых файлов")
    }
    if (process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"] === undefined || process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"] === "") {
      throw new Error("Не указан путь событий lifecycle test file")
    }
    this.reporter = createTestFileLifecycleReporter(outputPath)
  }

  onTestModuleEnd(testModule) {
    return this.reporter.onTestModuleEnd(testModule)
  }

  onTestModuleStart(testModule) {
    return this.reporter.onTestModuleStart(testModule)
  }

  onTestRunEnd() {
    return this.reporter.onTestRunEnd()
  }
}
