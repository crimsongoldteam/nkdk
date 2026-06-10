import fs, { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createProjectYamlCache } from "./projectYamlCache"

describe("ProjectYamlCache", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()

    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-yaml-cache-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  it("reads and parses each file only once", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Свойства.yaml")
    writeFileSync(filePath, "Имя: Товары\n")
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()

    const first = cache.get(filePath)
    const second = cache.get(filePath)

    expect(first).toBe(second)
    expect(first).toMatchObject({
      filePath,
      text: "Имя: Товары\n",
      parsed: {
        data: { Имя: "Товары" },
      },
    })
    expect(readFileSync).toHaveBeenCalledTimes(1)
  })

  it("returns read errors as cached values", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "missing.yaml")
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()

    const first = cache.get(filePath)
    const second = cache.get(filePath)

    expect(first).toBe(second)
    expect(first).toMatchObject({ filePath, error: expect.any(Error) })
    expect(readFileSync).toHaveBeenCalledTimes(1)
  })
})
