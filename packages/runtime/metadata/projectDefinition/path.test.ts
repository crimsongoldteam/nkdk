import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { parseProjectPath, projectPathFromFileSystem, resolveProjectPath } from "./path"

describe("project path boundary", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("нормализует разделители переносимого пути и сохраняет обычные точки в имени", () => {
    expect(parseProjectPath("cf\\Справочник\\Товары\\Свойства.yaml"))
      .toBe("cf/Справочник/Товары/Свойства.yaml")
    expect(parseProjectPath("..backup/file.yaml")).toBe("..backup/file.yaml")
  })

  it.each([
    "../secret.yaml",
    "C:\\secret.yaml",
    "\\\\server\\share\\secret.yaml",
    "/private/secret.yaml",
    "file:///secret.yaml",
  ])("отвергает абсолютный или выходящий из проекта путь %s", (input) => {
    expect(() => parseProjectPath(input)).toThrow("Путь находится вне NKDK-проекта")
  })

  it.each([
    "cf//Свойства.yaml",
    "cf/./Свойства.yaml",
    "cf/\0Свойства.yaml",
    "",
  ])("отвергает некорректный переносимый путь %s", (input) => {
    expect(() => parseProjectPath(input)).toThrow("Некорректный путь NKDK-проекта")
  })

  it("разрешает пустой путь только при явном выборе корня", () => {
    expect(parseProjectPath("", { allowRoot: true })).toBe("")
  })

  it("преобразует нативный путь внутри проекта в переносимый и обратно", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-path-"))
    tempDirs.push(projectDir)
    const native = join(projectDir, "cf", "Справочник", "Товары", "Свойства.yaml")

    const projectPath = projectPathFromFileSystem(projectDir, native)

    expect(projectPath).toBe("cf/Справочник/Товары/Свойства.yaml")
    expect(resolveProjectPath(projectDir, projectPath)).toBe(resolve(native))
  })

  it("отвергает нативный путь вне проекта", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-path-"))
    tempDirs.push(projectDir)

    expect(() => projectPathFromFileSystem(projectDir, resolve(projectDir, "..", "secret.yaml")))
      .toThrow("Путь находится вне NKDK-проекта")
  })
})
