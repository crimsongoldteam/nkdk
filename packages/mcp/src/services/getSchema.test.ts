import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getSchema } from "./getSchema"

const core = vi.hoisted(() => ({
  exportJSONSchemaForProjectFile: vi.fn(),
  exportJSONSchemaForSchemaName: vi.fn(),
  listSchemaSummaryKeys: vi.fn(),
  splitSearchTerms: vi.fn(),
  summarizeJSONSchema: vi.fn(),
}))

vi.mock("../coreApi", () => ({
  loadCoreApi: vi.fn(async () => ({
    ...core,
    ProjectFileSchemaError: Error,
  })),
}))

describe("getSchema service", () => {
  const tempDirs: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    core.splitSearchTerms.mockImplementation((query: string) => query.trim().split(/\s+/).filter(Boolean))
    core.exportJSONSchemaForSchemaName.mockReturnValue({ type: "object", properties: {} })
    core.exportJSONSchemaForProjectFile.mockReturnValue({ type: "object", properties: { Реквизиты: {} } })
    core.summarizeJSONSchema.mockReturnValue({
      title: "ПолеВвода",
      fields: [{ key: "ПутьКДанным" }],
    })
    core.listSchemaSummaryKeys.mockReturnValue(["Вид", "ПутьКДанным"])
  })

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns schema summary by schema name", async () => {
    const projectDir = createProject()
    const result = await getSchema({ projectDir, metadataRef: "InputField" })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.format).toBe("summary")
    expect(result.result.kind).toBe("summary")
    if (result.result.kind !== "summary") throw new Error("expected summary result")
    expect(JSON.stringify(result.result.summary)).toContain("ПолеВвода")
    expect(core.exportJSONSchemaForSchemaName).toHaveBeenCalledWith({
      context: { defaultLanguage: "ru", version: "2.20" },
      name: "InputField",
      mode: "externalRefs",
    })
  })

  it("returns filtered keys", async () => {
    const projectDir = createProject()
    const result = await getSchema({ projectDir, metadataRef: "InputField", keys: "путь|вид" })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.result.kind).toBe("keys")
    if (result.result.kind !== "keys") throw new Error("expected keys result")
    expect(result.result.keys).toEqual(expect.arrayContaining(["Вид", "ПутьКДанным"]))
    expect(result.result.keys).not.toContain("ЦветТекста")
    expect(core.listSchemaSummaryKeys).toHaveBeenCalledWith(
      { type: "object", properties: {} },
      { requiredOnly: false, search: undefined, exact: false, keyTerms: "путь|вид" },
    )
  })

  it("returns full JSON schema with inline refs", async () => {
    const projectDir = createProject()
    const result = await getSchema({
      structurePath: "Справочник/Контрагенты/Свойства.yaml",
      format: "jsonSchema",
      mode: "inline",
      projectDir,
      componentPath: "cfe/Расширение",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.result.kind).toBe("jsonSchema")
    if (result.result.kind !== "jsonSchema") throw new Error("expected jsonSchema result")
    expect(JSON.stringify(result.result.schema)).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(core.exportJSONSchemaForProjectFile).toHaveBeenCalledWith({
      context: { defaultLanguage: "ru", version: "2.20" },
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      projectDir: join(projectDir, "cfe", "Расширение"),
      mode: "inline",
    })
  })

  it("returns invalid_arguments for incompatible flags", async () => {
    const projectDir = createProject()
    const result = await getSchema({ projectDir, metadataRef: "InputField", format: "jsonSchema", keys: true })

    expect(result).toEqual({
      ok: false,
      code: "invalid_arguments",
      message: "format=jsonSchema несовместим с keys, required, search и exact",
    })
  })

  it("returns invalid_arguments when exact search finds no field", async () => {
    const projectDir = createProject()
    core.summarizeJSONSchema.mockReturnValue(undefined)
    const result = await getSchema({ projectDir, metadataRef: "InputField", search: "НесуществующееПоле", exact: true })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected failure")
    expect(result.code).toBe("invalid_arguments")
    expect(result.message).toContain('Поле "НесуществующееПоле" не найдено')
  })

  it("requires exactly one schema source", async () => {
    const projectDir = createProject()

    await expect(getSchema({ projectDir })).resolves.toMatchObject({
      ok: false,
      code: "invalid_arguments",
    })
    await expect(getSchema({ projectDir, metadataRef: "InputField", structurePath: "Configuration.yaml" })).resolves
      .toMatchObject({
        ok: false,
        code: "invalid_arguments",
      })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-schema-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
    return projectDir
  }
})
