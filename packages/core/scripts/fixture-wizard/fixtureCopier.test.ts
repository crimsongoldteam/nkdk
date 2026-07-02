import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { buildCopyPlan, copyFixtures, formatCopyPlan, formatTestCommands, verifyCopyPlan } from "./fixtureCopier"
import type { CopyPlan, FixtureSelection, MetadataTarget, XmlCandidate } from "./types"

const tempRoots: string[] = []

async function createTempRoot() {
  const root = await mkdtemp(join(tmpdir(), "fixture-wizard-copy-"))
  tempRoots.push(root)
  return root
}

function candidate(sourceXmlDir: string, fileName: string): XmlCandidate {
  return {
    name: fileName.replace(/\.xml$/i, ""),
    fileName,
    path: join(sourceXmlDir, fileName),
  }
}

function target(root: string): MetadataTarget {
  const itemDir = join(root, "packages/core/metadata/appliedObjects/metadataDocument")

  return {
    metadataItem: "metadataDocument",
    itemDir,
    fixturesDir: join(itemDir, "__fixtures__"),
    syncXmlDir: join(itemDir, "__fixtures__/sync/xml"),
    xmlDir: "Documents",
  }
}

async function writeFixture(path: string, content: string | Buffer) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

describe("fixtureCopier", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  it("buildCopyPlan строит операции для full, minimal, sync-root и связанных файлов", async () => {
    const root = await createTempRoot()
    const sourceXmlDir = join(root, "dump/Documents")
    const full = candidate(sourceXmlDir, "ДокументВсеСвойства.xml")
    const minimal = candidate(sourceXmlDir, "ДокументПоУмолчанию.xml")
    const selection: FixtureSelection = { full, minimal }
    const metadataTarget = target(root)
    await writeFixture(full.path, "<full />")
    await writeFixture(minimal.path, "<minimal />")
    await writeFixture(join(sourceXmlDir, full.name, "Ext/ManagerModule.bsl"), "manager")
    await writeFixture(join(sourceXmlDir, full.name, "Forms/Форма/Ext/Form.xml"), "<form />")
    await mkdir(join(sourceXmlDir, full.name, "Templates"), { recursive: true })

    await expect(buildCopyPlan({ target: metadataTarget, sourceXmlDir, selection })).resolves.toMatchObject({
      metadataItem: "metadataDocument",
      sourceXmlDir,
      fixturesDir: metadataTarget.fixturesDir,
      syncXmlDir: metadataTarget.syncXmlDir,
      fullName: full.name,
      overwrites: [],
      operations: [
        {
          source: full.path,
          target: join(metadataTarget.fixturesDir, "full.xml"),
          kind: "full",
        },
        {
          source: minimal.path,
          target: join(metadataTarget.fixturesDir, "minimal.xml"),
          kind: "minimal",
        },
        {
          source: full.path,
          target: join(metadataTarget.syncXmlDir, full.fileName),
          kind: "sync-root",
        },
        {
          source: join(sourceXmlDir, full.name, "Ext/ManagerModule.bsl"),
          target: join(metadataTarget.syncXmlDir, "Ext/ManagerModule.bsl"),
          kind: "related",
        },
        {
          source: join(sourceXmlDir, full.name, "Forms/Форма/Ext/Form.xml"),
          target: join(metadataTarget.syncXmlDir, "Forms/Форма/Ext/Form.xml"),
          kind: "related",
        },
      ],
    })
  })

  it("buildCopyPlan не добавляет minimal.xml, если minimal не выбран, и отмечает перезаписи", async () => {
    const root = await createTempRoot()
    const sourceXmlDir = join(root, "dump/Documents")
    const full = candidate(sourceXmlDir, "ДокументВсеСвойства.xml")
    const metadataTarget = target(root)
    await writeFixture(full.path, "<full />")
    await writeFixture(join(metadataTarget.fixturesDir, "full.xml"), "<old />")
    await writeFixture(join(metadataTarget.syncXmlDir, full.fileName), "<old />")

    const plan = await buildCopyPlan({
      target: metadataTarget,
      sourceXmlDir,
      selection: { full },
    })

    expect(plan.operations.map((operation) => operation.kind)).toEqual(["full", "sync-root"])
    expect(plan.overwrites).toEqual(plan.operations)
  })

  it("copyFixtures копирует без изменения байтов и verifyCopyPlan проверяет результат", async () => {
    const root = await createTempRoot()
    const source = join(root, "source/full.xml")
    const targetPath = join(root, "target/full.xml")
    const payload = Buffer.from([0, 1, 2, 3, 255, 10])
    await writeFixture(source, payload)
    const plan: CopyPlan = {
      metadataItem: "metadataDocument",
      sourceXmlDir: join(root, "source"),
      fixturesDir: join(root, "target"),
      syncXmlDir: join(root, "target/sync/xml"),
      fullName: "ДокументВсеСвойства",
      operations: [{ source, target: targetPath, kind: "full" }],
      overwrites: [],
    }

    await expect(copyFixtures(plan)).resolves.toEqual({
      created: [targetPath],
      updated: [],
      verified: [targetPath],
    })
    await expect(readFile(targetPath)).resolves.toEqual(payload)
    await expect(verifyCopyPlan(plan)).resolves.toEqual([targetPath])
  })

  it("copyFixtures разделяет созданные и обновлённые файлы", async () => {
    const root = await createTempRoot()
    const createdSource = join(root, "source/created.xml")
    const updatedSource = join(root, "source/updated.xml")
    const createdTarget = join(root, "target/created.xml")
    const updatedTarget = join(root, "target/updated.xml")
    await writeFixture(createdSource, "<created />")
    await writeFixture(updatedSource, "<updated />")
    await writeFixture(updatedTarget, "<old />")
    const plan: CopyPlan = {
      metadataItem: "metadataDocument",
      sourceXmlDir: join(root, "source"),
      fixturesDir: join(root, "target"),
      syncXmlDir: join(root, "target/sync/xml"),
      fullName: "ДокументВсеСвойства",
      operations: [
        { source: createdSource, target: createdTarget, kind: "full" },
        { source: updatedSource, target: updatedTarget, kind: "sync-root" },
      ],
      overwrites: [{ source: updatedSource, target: updatedTarget, kind: "sync-root" }],
    }

    await expect(copyFixtures(plan)).resolves.toEqual({
      created: [createdTarget],
      updated: [updatedTarget],
      verified: [createdTarget, updatedTarget],
    })
  })

  it("verifyCopyPlan сообщает целевой файл, если байты отличаются", async () => {
    const root = await createTempRoot()
    const source = join(root, "source/full.xml")
    const targetPath = join(root, "target/full.xml")
    await writeFixture(source, Buffer.from([1, 2, 3]))
    await writeFixture(targetPath, Buffer.from([1, 2, 4]))
    const plan: CopyPlan = {
      metadataItem: "metadataDocument",
      sourceXmlDir: join(root, "source"),
      fixturesDir: join(root, "target"),
      syncXmlDir: join(root, "target/sync/xml"),
      fullName: "ДокументВсеСвойства",
      operations: [{ source, target: targetPath, kind: "full" }],
      overwrites: [],
    }

    await expect(verifyCopyPlan(plan)).rejects.toThrow(`Скопированный файл отличается от источника: ${targetPath}`)
  })

  it("copyFixtures не создаёт пустые связанные директории", async () => {
    const root = await createTempRoot()
    const sourceXmlDir = join(root, "dump/Documents")
    const full = candidate(sourceXmlDir, "ДокументВсеСвойства.xml")
    const metadataTarget = target(root)
    await writeFixture(full.path, "<full />")
    await mkdir(join(sourceXmlDir, full.name, "Commands"), { recursive: true })

    const plan = await buildCopyPlan({
      target: metadataTarget,
      sourceXmlDir,
      selection: { full },
    })
    await copyFixtures(plan)

    await expect(readdir(join(metadataTarget.syncXmlDir, "Commands"))).rejects.toMatchObject({
      code: "ENOENT",
    })
  })

  it("formatTestCommands возвращает команды для проверки XML-конвейера", () => {
    expect(formatTestCommands("metadataDocument")).toEqual([
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts",
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts",
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts",
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts",
    ])
  })

  it("formatCopyPlan показывает операции и перезаписи", () => {
    const plan: CopyPlan = {
      metadataItem: "metadataDocument",
      sourceXmlDir: "/dump/Documents",
      fixturesDir: "/project/fixtures",
      syncXmlDir: "/project/fixtures/sync/xml",
      fullName: "ДокументВсеСвойства",
      operations: [{ source: "/dump/full.xml", target: "/project/fixtures/full.xml", kind: "full" }],
      overwrites: [{ source: "/dump/full.xml", target: "/project/fixtures/full.xml", kind: "full" }],
    }

    expect(formatCopyPlan(plan)).toContain("metadataDocument")
    expect(formatCopyPlan(plan)).toContain("[full] /dump/full.xml -> /project/fixtures/full.xml")
    expect(formatCopyPlan(plan)).toContain("Перезаписи:")
  })
})
