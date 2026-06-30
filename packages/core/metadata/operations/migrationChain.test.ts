import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareMetadataMigrationChain } from "./migrationChain"

describe("prepareMetadataMigrationChain", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createDirs(): { yamlDir: string; xmlDir: string } {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-migrations-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-migrations-xml-"))
    tempDirs.push(yamlDir, xmlDir)
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    return { yamlDir, xmlDir }
  }

  it("applies rename files sequentially and returns from/to after previous files", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": Номенклатура\n')
    writeFileSync(
      join(yamlDir, "Миграции", "2026-06-30-120001.yaml"),
      '"Справочник.Номенклатура.Реквизит.Артикул": КодПоставщика\n',
    )

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: ["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"],
      yamlPaths: ["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.КодПоставщика"],
      xmlAreaByMigrationPath: () => ({
        kind: "owner",
        itemType: "MetadataCatalog",
        itemTypePrefix: "Справочник",
        itemName: "Номенклатура",
        xmlDir: "Catalogs",
      }),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.migrationsToApply).toEqual([
      { fileName: "2026-06-30-120000.yaml", from: "Справочник.Товары", to: "Справочник.Номенклатура" },
      {
        fileName: "2026-06-30-120001.yaml",
        from: "Справочник.Номенклатура.Реквизит.Артикул",
        to: "Справочник.Номенклатура.Реквизит.КодПоставщика",
      },
    ])
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура")).toBe("Справочник.Товары")
  })

  it("rejects delete and add service values as ordinary invalid migration files", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": Удалить\n')

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: ["Справочник.Товары"],
      yamlPaths: [],
      xmlAreaByMigrationPath: () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "migration_chain_invalid",
      migrationErrors: [expect.objectContaining({ code: "missing_source_path" })],
    })
  })

  it("blocks duplicate claims and same-reference conflicts", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": Номенклатура\n')
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120001.yaml"), '"Справочник.Товары": Номенклатура2\n')

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: ["Справочник.Товары"],
      yamlPaths: ["Справочник.Номенклатура2"],
      xmlAreaByMigrationPath: () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "migration_chain_invalid",
      migrationErrors: [expect.objectContaining({ code: "missing_source_path" })],
    })
  })

  it("blocks invalid applied migrations state", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(xmlDir, ".nakidka-migrations.yaml"), "applied: 42\n")

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: [],
      yamlPaths: [],
      xmlAreaByMigrationPath: () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      migrationErrors: [expect.objectContaining({ code: "invalid_applied_migrations_state" })],
    })
  })
})
