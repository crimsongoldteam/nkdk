import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertImportTargetEmpty,
  resolveComponent,
  resolveProjectRoot,
  resolveStructurePath,
} from "./componentResolver"

describe("componentResolver", () => {
  const tempDirs = new Set<string>()

  afterEach(() => {
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true })
    tempDirs.clear()
  })

  it("defaults componentPath to cf and returns root .nkdk path", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir })).toEqual({
      ok: true,
      projectDir,
      componentPath: "cf",
      componentDir: join(projectDir, "cf"),
      nkdkDir: join(projectDir, ".nkdk"),
    })
  })

  it("resolves project root without requiring cf", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-project-root-"))
    tempDirs.add(projectDir)

    expect(resolveProjectRoot(projectDir)).toEqual({
      ok: true,
      projectDir,
      nkdkDir: join(projectDir, ".nkdk"),
    })
  })

  it("accepts nested extension component path", () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })

    expect(resolveComponent({ projectDir, componentPath: "cfe/Расширение" })).toMatchObject({
      ok: true,
      componentPath: "cfe/Расширение",
      componentDir: join(projectDir, "cfe", "Расширение"),
    })
  })

  it("rejects absolute and escaping component paths", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir, componentPath: join(projectDir, "cf") })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
    expect(resolveComponent({ projectDir, componentPath: "../cf" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
    expect(resolveComponent({ projectDir, componentPath: "C:\\outside\\cf" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
  })

  it("rejects non-standard component root", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir, componentPath: "src/cf" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
  })

  it("requires cf in project root", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-component-"))
    tempDirs.add(projectDir)

    expect(resolveComponent({ projectDir })).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    })
  })

  it("creates a missing cf when createIfMissing is true", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-component-"))
    tempDirs.add(projectDir)

    expect(resolveComponent({ projectDir, componentPath: "cf", createIfMissing: true })).toEqual({
      ok: true,
      projectDir,
      componentPath: "cf",
      componentDir: join(projectDir, "cf"),
      nkdkDir: join(projectDir, ".nkdk"),
    })
  })

  it("creates missing component only when createIfMissing is true", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir, componentPath: "epf/Загрузка" })).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    })
    expect(resolveComponent({ projectDir, componentPath: "epf/Загрузка", createIfMissing: true })).toMatchObject({
      ok: true,
      componentDir: join(projectDir, "epf", "Загрузка"),
    })
  })

  it("rejects component that contains its own .nkdk directory", () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "cfe", "Расширение", ".nkdk"), { recursive: true })

    expect(resolveComponent({ projectDir, componentPath: "cfe/Расширение" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
  })

  it("requires import target directory to be empty", () => {
    const projectDir = createProject()

    expect(assertImportTargetEmpty(join(projectDir, "cf"))).toBeUndefined()
    writeFileSync(join(projectDir, "cf", "Configuration.yaml"), "name: Test\n")
    expect(assertImportTargetEmpty(join(projectDir, "cf"))).toMatchObject({
      code: "invalid_arguments",
    })
  })

  it("normalizes structurePath and rejects escape", () => {
    const projectDir = createProject()

    expect(resolveStructurePath(join(projectDir, "cf"), "Catalogs/Товары.yaml")).toBe("Catalogs/Товары.yaml")
    expect(() => resolveStructurePath(join(projectDir, "cf"), "../secret.yaml")).toThrow(
      "structurePath должен находиться внутри компонента",
    )
    expect(() => resolveStructurePath(join(projectDir, "cf"), "C:\\outside\\secret.yaml")).toThrow(
      "structurePath должен быть относительным путем",
    )
    expect(() => resolveStructurePath(join(projectDir, "cf"), "file:///outside/secret.yaml")).toThrow(
      "structurePath должен быть относительным путем",
    )
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-component-"))
    tempDirs.add(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    return projectDir
  }
})
