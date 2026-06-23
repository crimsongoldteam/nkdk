import { resolve } from "path"
import { describe, expect, it } from "vitest"
import { getSchema } from "./getSchema"

describe("getSchema service", () => {
  it("returns schema summary by schema name", () => {
    const result = getSchema({ target: "InputField" })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.format).toBe("summary")
    expect(result.result.kind).toBe("summary")
    if (result.result.kind !== "summary") throw new Error("expected summary result")
    expect(JSON.stringify(result.result.summary)).toContain("ПолеВвода")
  })

  it("returns filtered keys", () => {
    const result = getSchema({ target: "InputField", keys: "путь|вид" })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.result.kind).toBe("keys")
    if (result.result.kind !== "keys") throw new Error("expected keys result")
    expect(result.result.keys).toEqual(expect.arrayContaining(["Вид", "ПутьКДанным"]))
    expect(result.result.keys).not.toContain("ЦветТекста")
  })

  it("returns full JSON schema with inline refs", () => {
    const result = getSchema({
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
  })

  it("returns invalid_arguments for incompatible flags", () => {
    const result = getSchema({ target: "InputField", format: "jsonSchema", keys: true })

    expect(result).toEqual({
      ok: false,
      code: "invalid_arguments",
      message: "format=jsonSchema несовместим с keys, required, search и exact",
    })
  })

  it("returns invalid_arguments when exact search finds no field", () => {
    const result = getSchema({ target: "InputField", search: "НесуществующееПоле", exact: true })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected failure")
    expect(result.code).toBe("invalid_arguments")
    expect(result.message).toContain('Поле "НесуществующееПоле" не найдено')
  })
})
