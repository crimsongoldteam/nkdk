import { mkdir, mkdtemp, readFile, stat, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { ScenarioBlock, ScenarioOperation } from "./matrix/types"
import {
  applyScenarioBlock,
  applyScenarioOperation,
  createOperationDependencies,
} from "./operation"

describe("scenario file operation", () => {
  it("applies sequential transitions to the selected extension component", async () => {
    const projectDir = await projectFixture()
    const componentDir = join(projectDir, "cfe/Расширение_All")
    await mkdir(componentDir, { recursive: true })
    const path = join(componentDir, "Конфигурация.yaml")
    await writeFile(path, "первое состояние")

    const changed = await applyScenarioBlock(projectDir, block("cfe/Расширение_All", [
      operation([{ path: "Конфигурация.yaml", before: "первое состояние", after: "второе состояние" }]),
      operation([{ path: "Конфигурация.yaml", before: "второе состояние", after: "третье состояние" }], "operation:second"),
    ]))

    expect(changed).toEqual(["Конфигурация.yaml"])
    await expect(readFile(path, "utf8")).resolves.toBe("третье состояние")
  })

  it("rejects traversal relative to the selected component", async () => {
    const projectDir = await projectFixture()
    await expect(applyScenarioBlock(projectDir, block("cf", [operation([
      { path: "../outside.yaml", before: null, after: "value" },
    ])]))).rejects.toThrow(/путь/iu)
  })

  it("creates multiple files atomically and returns sorted relative paths", async () => {
    const projectDir = await projectFixture()
    const changed = await applyScenarioOperation(projectDir, operation([
      { path: "Справочник/Тест/Модуль.bsl", before: null, after: new Uint8Array([1, 2]) },
      { path: "Справочник/Тест/Свойства.yaml", before: null, after: "value" },
    ]))

    expect(changed).toEqual([
      "Справочник/Тест/Модуль.bsl",
      "Справочник/Тест/Свойства.yaml",
    ])
    await expect(readFile(join(projectDir, "cf/Справочник/Тест/Модуль.bsl")))
      .resolves.toEqual(Buffer.from([1, 2]))
  })

  it("replaces a file and restores it through the reverse transition", async () => {
    const projectDir = await projectFixture()
    const path = join(projectDir, "cf/Справочник/Тест/Свойства.yaml")
    await mkdir(join(projectDir, "cf/Справочник/Тест"), { recursive: true })
    await writeFile(path, "before")

    await applyScenarioOperation(projectDir, operation([
      { path: "Справочник/Тест/Свойства.yaml", before: "before", after: "after" },
    ]))
    await applyScenarioOperation(projectDir, operation([
      { path: "Справочник/Тест/Свойства.yaml", before: "after", after: "before" },
    ]))

    await expect(readFile(path, "utf8")).resolves.toBe("before")
  })

  it("deletes a created file and removes empty directories only up to cf", async () => {
    const projectDir = await projectFixture()
    const path = join(projectDir, "cf/Справочник/Тест/Свойства.yaml")
    await mkdir(join(projectDir, "cf/Справочник/Тест"), { recursive: true })
    await writeFile(path, "value")

    await applyScenarioOperation(projectDir, operation([
      { path: "Справочник/Тест/Свойства.yaml", before: "value", after: null },
    ]))

    await expect(stat(join(projectDir, "cf"))).resolves.toMatchObject({})
    await expect(stat(join(projectDir, "cf/Справочник"))).rejects.toMatchObject({ code: "ENOENT" })
  })

  it.each([
    ["absolute path", "/outside.yaml"],
    ["parent traversal", "Справочник/../outside.yaml"],
    ["backslash", "Справочник\\outside.yaml"],
  ])("rejects %s", async (_name, path) => {
    const projectDir = await projectFixture()
    await expect(applyScenarioOperation(projectDir, operation([
      { path, before: null, after: "value" },
    ]))).rejects.toThrow(/путь/iu)
  })

  it("rejects a symlink inside the target path", async () => {
    const projectDir = await projectFixture()
    const outside = await mkdtemp(join(tmpdir(), "nkdk-operation-outside-"))
    await symlink(outside, join(projectDir, "cf/Справочник"))

    await expect(applyScenarioOperation(projectDir, operation([
      { path: "Справочник/Тест.yaml", before: null, after: "value" },
    ]))).rejects.toThrow(/символическ/iu)
  })

  it("rejects a before mismatch without changing any file", async () => {
    const projectDir = await projectFixture()
    const directory = join(projectDir, "cf/Справочник")
    await mkdir(directory)
    await writeFile(join(directory, "first.yaml"), "actual")

    await expect(applyScenarioOperation(projectDir, operation([
      { path: "Справочник/first.yaml", before: "expected", after: "changed" },
      { path: "Справочник/second.yaml", before: null, after: "new" },
    ]))).rejects.toThrow(/before|исходн/iu)

    await expect(readFile(join(directory, "first.yaml"), "utf8")).resolves.toBe("actual")
    await expect(readFile(join(directory, "second.yaml"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
  })

  it("rolls already changed files back when a later atomic write fails", async () => {
    const projectDir = await projectFixture()
    const defaults = createOperationDependencies()
    const dependencies = {
      ...defaults,
      async writeAtomic(path: string, contents: string | Uint8Array) {
        if (path.endsWith("second.yaml")) throw new Error("planned write failure")
        await defaults.writeAtomic(path, contents)
      },
    }

    await expect(applyScenarioOperation(projectDir, operation([
      { path: "Справочник/first.yaml", before: null, after: "first" },
      { path: "Справочник/second.yaml", before: null, after: "second" },
    ]), dependencies)).rejects.toThrow("planned write failure")

    await expect(readFile(join(projectDir, "cf/Справочник/first.yaml"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
  })
})

function operation(changes: ScenarioOperation["changes"], key = "operation:test"): ScenarioOperation {
  return { key, kind: "add-child", changes }
}

function block(
  componentPath: ScenarioBlock["componentPath"],
  operations: readonly ScenarioOperation[],
): ScenarioBlock {
  return { key: "test:probe", layerKey: "test", componentPath, operations }
}

async function projectFixture(): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-operation-"))
  await mkdir(join(projectDir, "cf"))
  return projectDir
}
