import fs from "node:fs"
import { basename } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { trackTempProjectDirs } from "../tests/tempProjectDir"
import { buildProjectStateSnapshot } from "./builder"
import {
  loadBinaryProjectState,
  projectStateBinaryPath,
  saveBinaryProjectState,
} from "./persistence"
import { ProjectStateSnapshotView } from "./snapshot"
import { resourceUpdate } from "./testData"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./fragment"

describe("двоичный файл состояния проекта", () => {
  const projects = trackTempProjectDirs("nkdk-binary-state-")

  afterEach(async () => {
    vi.restoreAllMocks()
    await projects.removeAll()
  })

  it("записывает непосредственно в целевой файл", async () => {
    const projectDir = await projects.create()
    const target = projectStateBinaryPath(projectDir)
    const open = vi.spyOn(fs.promises, "open")

    await saveBinaryProjectState(projectDir, resourceSnapshot())

    expect(open).toHaveBeenCalledWith(target, "w")
  })

  it("записывает все общие буферы одним файлом и загружает их обратно", async () => {
    const projectDir = await projects.create()
    const expected = resourceSnapshot()

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
    await saveBinaryProjectState(projectDir, resourceSnapshot())
    const bytes = corrupt(await fs.promises.readFile(target))
    await fs.promises.writeFile(target, bytes)

    await expect(loadBinaryProjectState(projectDir)).resolves.toBeUndefined()
    await expect(fs.promises.access(target)).rejects.toMatchObject({ code: "ENOENT" })
  })

})

function resourceSnapshot() {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile(resourceUpdate("cf/icon.png"), 5n)
  return buildProjectStateSnapshot({ fragments: [openProjectStateFragment(writer.finish())], deletions: [] })
}
