import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { createImportSharedMetadata } from "./metadataSnapshot"
import {
  buildComponentReferenceSnapshot,
  createLayeredImportReferenceSnapshot,
  createLayeredOwnerMetadataCache,
} from "./componentReferenceIndex"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("buildComponentReferenceSnapshot", () => {
  it("builds object, member and owner facts only from YAML inside componentDir", async () => {
    const projectDir = createTempDir("cold")
    const componentDir = join(projectDir, "cf")
    writeYaml(componentDir, "Справочник/Контрагенты/Свойства.yaml", [
      "Реквизиты:",
      "  ИНН:",
      "    Тип: Строка",
      "НеизвестноеДляСхемы: true",
    ])
    writeYaml(projectDir, "cfe/Другое/Справочник/Чужой/Свойства.yaml", "Реквизиты: [")
    const configurationSnapshotPath = join(
      projectDir,
      ".nkdk",
      "components",
      "cf",
      "configuration-index.bin"
    )
    mkdirSync(dirname(configurationSnapshotPath), { recursive: true })
    writeFileSync(configurationSnapshotPath, "broken snapshot")

    const snapshot = await buildComponentReferenceSnapshot({
      componentDir,
      context: mockContext,
      concurrency: 2,
    })
    const cache = createLayeredOwnerMetadataCache({
      projectDir: componentDir,
      snapshots: createLayeredImportReferenceSnapshot({ local: snapshot }),
    })
    const owner = cache.get({ kind: "Справочник", name: "Контрагенты" })

    expect(snapshot.reference.stats.objectEntries).toBe(1)
    expect(snapshot.reference.stats.memberEntries).toBeGreaterThanOrEqual(1)
    expect(owner.status).toBe("ok")
    if (owner.status !== "ok") throw new Error("Ожидались факты справочника")
    expect(owner.owner.fieldIndex.fields.get("ИНН")).toMatchObject({
      kind: "attribute",
      name: "ИНН",
    })
    expect(cache.get({ kind: "Справочник", name: "Чужой" }).status).toBe("not-found")
  })

  it("fails the operation when componentDir cannot be read", async () => {
    const projectDir = createTempDir("missing")

    await expect(
      buildComponentReferenceSnapshot({
        componentDir: join(projectDir, "cf"),
        context: mockContext,
        concurrency: 1,
      })
    ).rejects.toThrow()
  })

  it("fails the operation on malformed YAML instead of running validation diagnostics", async () => {
    const componentDir = createTempDir("syntax")
    writeYaml(componentDir, "Справочник/Контрагенты/Свойства.yaml", "Реквизиты: [")

    await expect(
      buildComponentReferenceSnapshot({
        componentDir,
        context: mockContext,
        concurrency: 1,
      })
    ).rejects.toThrow("Не удалось разобрать YAML-файл")
  })
})

describe("layered import reference snapshot", () => {
  it("keeps snapshots separate and resolves local owners before base owners", () => {
    const base = ownerSnapshot([
      ownerFacts("Справочник", "Контрагенты", "/cf/Контрагенты.yaml"),
      ownerFacts("Справочник", "Номенклатура", "/cf/Номенклатура.yaml"),
    ])
    const local = ownerSnapshot([
      ownerFacts("Справочник", "Контрагенты", "/cfe/current/Контрагенты.yaml"),
      ownerFacts("Справочник", "Локальный", "/cfe/current/Локальный.yaml"),
    ])
    const otherExtension = ownerSnapshot([
      ownerFacts("Справочник", "Чужой", "/cfe/other/Чужой.yaml"),
    ])

    const snapshots = createLayeredImportReferenceSnapshot({ local, base })
    const cache = createLayeredOwnerMetadataCache({ projectDir: "/project", snapshots })

    expect(snapshots.local).toBe(local)
    expect(snapshots.base).toBe(base)
    expect(cache.get({ kind: "Справочник", name: "Контрагенты" })).toMatchObject({
      status: "ok",
      owner: { filePath: "/cfe/current/Контрагенты.yaml" },
    })
    expect(cache.get({ kind: "Справочник", name: "Номенклатура" })).toMatchObject({
      status: "ok",
      owner: { filePath: "/cf/Номенклатура.yaml" },
    })
    expect(cache.get({ kind: "Справочник", name: "Чужой" }).status).toBe("not-found")
    expect(cache.listRefs("Справочник")).toEqual([
      { kind: "Справочник", name: "Контрагенты" },
      { kind: "Справочник", name: "Локальный" },
      { kind: "Справочник", name: "Номенклатура" },
    ])
    expect(otherExtension.owners).not.toBe(snapshots.local.owners)
    expect(otherExtension.owners).not.toBe(snapshots.base?.owners)
  })
})

function createTempDir(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `nkdk-component-reference-${name}-`))
  tempDirs.push(dir)
  return dir
}

function writeYaml(root: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(root, ...projectPath.split("/"))
  mkdirSync(dirname(filePath), { recursive: true })
  const text = Array.isArray(lines) ? lines.join("\n") : lines
  writeFileSync(filePath, `${text.trimEnd()}\n`)
}

function ownerSnapshot(facts: ValidationOwnerFacts[]): SharedValidationSnapshot {
  return createImportSharedMetadata(facts)
}

function ownerFacts(kind: string, name: string, filePath: string): ValidationOwnerFacts {
  return {
    ref: { kind, name },
    filePath,
    fieldIndex: {
      fields: new Map(),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    },
  }
}
