import fs from "node:fs"
import { TestRunner } from "vitest"

export function recordLifecycleEvent(eventsPath, event) {
  if (eventsPath === undefined || eventsPath === "") {
    throw new Error("Не указан путь событий lifecycle test file")
  }
  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`)
}

export default class TestFileLifecycleRunner extends TestRunner {
  async importFile(filepath, source) {
    if (source !== "collect") return super.importFile(filepath, source)

    const eventsPath = process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"]
    const startTime = Date.now()
    recordLifecycleEvent(eventsPath, { file: filepath, startTime })
    const result = await super.importFile(filepath, source)
    recordLifecycleEvent(eventsPath, { file: filepath, startTime, collectedAt: Date.now() })
    return result
  }
}
