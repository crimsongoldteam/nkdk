import fs from "node:fs"
import { basename } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { trackTempProjectDirs } from "../tests/tempProjectDir"
import { buildProjectStateSnapshot } from "./builder"
import { createBinaryProjectStateQueryPort } from "./readSession"
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

  it("сохраняет несколько доказательств одной файловой цели после повторной загрузки", async () => {
    const projectDir = await projects.create()
    const writer = createProjectStateFragmentWriter()
    const target = {
      kind: "member" as const,
      canonical: "Document.Заказ.Template.Печать",
      fileBacked: {
        itemProjectPath: "cf/Макеты/Печать",
        ownerProjectPath: "cf/Свойства.yaml",
      },
    }
    writer.appendFile({ ...resourceUpdate("cf/Макеты/Печать/Template.xml"), targets: [target] }, 1n)
    writer.appendFile({ ...resourceUpdate("cf/Макеты/Печать/Ext/logo.png"), targets: [target] }, 2n)
    const initial = buildProjectStateSnapshot({
      fragments: [openProjectStateFragment(writer.finish())],
      deletions: [],
    })

    await saveBinaryProjectState(projectDir, initial)
    const loaded = await loadBinaryProjectState(projectDir)
    expect(loaded).toBeDefined()
    expect(resolveFileTarget(loaded!)).toMatchObject({ status: "found" })

    const withOneEvidence = buildProjectStateSnapshot({
      base: loaded!,
      fragments: [],
      deletions: ["cf/Макеты/Печать/Template.xml"],
    })
    expect(resolveFileTarget(withOneEvidence)).toMatchObject({ status: "found" })

    const withoutEvidence = buildProjectStateSnapshot({
      base: withOneEvidence,
      fragments: [],
      deletions: ["cf/Макеты/Печать/Ext/logo.png"],
    })
    expect(resolveFileTarget(withoutEvidence)).toMatchObject({ status: "missing" })
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

function resolveFileTarget(buffers: ReturnType<typeof resourceSnapshot>) {
  return createBinaryProjectStateQueryPort(new ProjectStateSnapshotView(buffers)).resolveTargets([{
    requestId: "target",
    componentPath: "cf",
    canonicalTarget: "Document.Заказ.Template.Печать",
  }])[0]
}
