import fs from "node:fs"
import { basename, dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { trackTempProjectDirs } from "../tests/tempProjectDir"
import { buildProjectStateSnapshot } from "./builder"
import {
  loadBinaryProjectState,
  projectStateBinaryPath,
  saveBinaryProjectState,
} from "./persistence"
import { ProjectStateSnapshotView } from "./snapshot"
import { resourceUpdate } from "./testData"

describe("двоичный файл состояния проекта", () => {
  const projects = trackTempProjectDirs("nkdk-binary-state-")

  afterEach(() => projects.removeAll())

  it("записывает все общие буферы одним файлом и загружает их обратно", async () => {
    const projectDir = await projects.create()
    const expected = buildProjectStateSnapshot({
      replacements: [{ update: resourceUpdate("cf/icon.png"), hash: 5n }],
      deletions: [],
    })

    await saveBinaryProjectState(projectDir, expected)
    const actual = await loadBinaryProjectState(projectDir)

    expect(actual).toBeDefined()
    expect(new ProjectStateSnapshotView(actual!).filePaths()).toEqual(["cf/icon.png"])
    expect(basename(projectStateBinaryPath(projectDir))).toBe("project-state.bin")
  })

  it.each([
    ["другую patch-версию", (bytes: Buffer) => { bytes.writeUInt16LE(3, 12); return bytes }],
    ["неверную границу раздела", (bytes: Buffer) => { bytes.writeUInt32LE(bytes.byteLength + 1, 36); return bytes }],
    ["неверную контрольную сумму", (bytes: Buffer) => { bytes[bytes.length - 1]! ^= 0xff; return bytes }],
    ["оборванный файл", (bytes: Buffer) => bytes.subarray(0, bytes.byteLength - 1)],
  ] as const)("удаляет повреждённый кэш: %s", async (_name, corrupt) => {
    const projectDir = await projects.create()
    const target = projectStateBinaryPath(projectDir)
    await saveBinaryProjectState(projectDir, buildProjectStateSnapshot({
      replacements: [{ update: resourceUpdate("cf/icon.png"), hash: 5n }],
      deletions: [],
    }))
    const bytes = corrupt(await fs.promises.readFile(target))
    await fs.promises.writeFile(target, bytes)

    await expect(loadBinaryProjectState(projectDir)).resolves.toBeUndefined()
    await expect(fs.promises.access(target)).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("удаляет оставшиеся временные файлы", async () => {
    const projectDir = await projects.create()
    const target = projectStateBinaryPath(projectDir)
    const temporary = join(dirname(target), ".project-state.bin.stale.tmp")
    await fs.promises.mkdir(dirname(target), { recursive: true })
    await fs.promises.writeFile(temporary, "stale")

    await expect(loadBinaryProjectState(projectDir)).resolves.toBeUndefined()
    await expect(fs.promises.access(temporary)).rejects.toMatchObject({ code: "ENOENT" })
  })
})
