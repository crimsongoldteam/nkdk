import fs, { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { createProjectYamlCache, createProjectYamlCacheFromEntries } from "./projectYamlCache"

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

  it("releases successful entries so large parsed YAML can be collected", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Свойства.yaml")
    writeFileSync(filePath, "Имя: Товары\n")
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()

    const first = cache.get(filePath)
    cache.release(filePath)
    const second = cache.get(filePath)

    expect(second).not.toBe(first)
    expect(second).toMatchObject({
      filePath,
      parsed: {
        data: { Имя: "Товары" },
      },
    })
    expect(readFileSync).toHaveBeenCalledTimes(2)
  })

  it("keeps read errors cached when released", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "missing.yaml")
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()

    const first = cache.get(filePath)
    cache.release(filePath)
    const second = cache.get(filePath)

    expect(second).toBe(first)
    expect(second).toMatchObject({ filePath, error: expect.any(Error) })
    expect(readFileSync).toHaveBeenCalledTimes(1)
  })

  it("can serve pre-parsed entries without invoking the reader again", () => {
    const parsed = parseMetadataYaml("Имя: Товары\n")
    const cache = createProjectYamlCacheFromEntries([
      { filePath: "/project/Справочник/Товары/Свойства.yaml", text: parsed.text, parsed },
    ])

    expect(cache.get("/project/Справочник/Товары/Свойства.yaml")).toMatchObject({
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      parsed,
    })
    cache.release("/project/Справочник/Товары/Свойства.yaml")
    expect(cache.get("/project/Справочник/Товары/Свойства.yaml")).toMatchObject({
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      parsed,
    })
  })
})
