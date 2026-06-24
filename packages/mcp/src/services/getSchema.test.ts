import { resolve } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
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

  it("returns schema summary by schema name", async () => {
    const result = await getSchema({ target: "InputField" })

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
    const result = await getSchema({ target: "InputField", keys: "путь|вид" })

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
    const result = await getSchema({
      target: "Справочник/Контрагенты/Свойства.yaml",
      format: "jsonSchema",
      mode: "inline",
      projectDir: resolve(process.cwd(), "../core/metadata/appliedObjects/configuration/__fixtures__/syncConfiguration/out"),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.result.kind).toBe("jsonSchema")
    if (result.result.kind !== "jsonSchema") throw new Error("expected jsonSchema result")
    expect(JSON.stringify(result.result.schema)).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(core.exportJSONSchemaForProjectFile).toHaveBeenCalledWith({
      context: { defaultLanguage: "ru", version: "2.20" },
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      projectDir: resolve(process.cwd(), "../core/metadata/appliedObjects/configuration/__fixtures__/syncConfiguration/out"),
      mode: "inline",
    })
  })

  it("returns invalid_arguments for incompatible flags", async () => {
    const result = await getSchema({ target: "InputField", format: "jsonSchema", keys: true })

    expect(result).toEqual({
      ok: false,
      code: "invalid_arguments",
      message: "format=jsonSchema несовместим с keys, required, search и exact",
    })
  })

  it("returns invalid_arguments when exact search finds no field", async () => {
    core.summarizeJSONSchema.mockReturnValue(undefined)
    const result = await getSchema({ target: "InputField", search: "НесуществующееПоле", exact: true })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected failure")
    expect(result.code).toBe("invalid_arguments")
    expect(result.message).toContain('Поле "НесуществующееПоле" не найдено')
  })
})
