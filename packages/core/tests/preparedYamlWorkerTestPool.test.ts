import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareYamlProjectWithPool } from "../metadata/project/preparedYamlProject"
import { mockContext } from "./mockContext"
import { createPreparedYamlWorkerTestPool } from "./preparedYamlWorkerTestPool"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("createPreparedYamlWorkerTestPool", () => {
  it("prepares one YAML file without constructing Piscina", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-test-pool-"))
    tempDirs.push(projectDir)
    const ownerDir = join(projectDir, "Справочник", "Товары")
    mkdirSync(ownerDir, { recursive: true })
    writeFileSync(join(ownerDir, "Свойства.yaml"), "Реквизиты: {}\n")
    const testPool = createPreparedYamlWorkerTestPool()

    try {
      const result = await prepareYamlProjectWithPool({
        projectDir,
        context: mockContext,
        pool: testPool.pool,
      })

      expect(result.ok).toBe(true)
    } finally {
      await testPool.close()
    }
  })
})
