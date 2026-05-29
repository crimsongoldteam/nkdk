import { afterEach, describe, expect, it, vi } from "vitest"
import { printJSONSchema } from "./schema"

describe("schema command", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints compact JSON schema for a project file", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Справочник/Товары/Свойства.yaml", {})

    expect(stdout).toHaveBeenCalledOnce()
    const text = String(stdout.mock.calls[0]?.[0])
    const schema = JSON.parse(text)
    expect(text).toContain("\n  ")
    expect(schema.properties.Реквизиты.additionalProperties).toEqual({ $ref: "nkdk://schema/MetadataCatalogAttribute" })
  })

  it("prints compact JSON schema by schema name", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("InputField", {})

    const schema = JSON.parse(String(stdout.mock.calls[0]?.[0]))
    expect(schema.properties.Вид).toEqual(expect.objectContaining({ const: "ПолеВвода" }))
  })

  it("prints inline JSON schema when requested", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Справочник/Товары/Свойства.yaml", { inline: true })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(JSON.parse(text).properties).toHaveProperty("Реквизиты")
  })

  it("resolves relative file from explicit project", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Документ/Заказ/Свойства.yaml", { project: process.cwd() })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(JSON.parse(text).properties).toHaveProperty("СтандартныеРеквизиты")
  })

  it("does not write stdout when schema lookup fails", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(printJSONSchema("UnknownSchema", {})).rejects.toThrow(/Неизвестная JSON Schema/)

    expect(stdout).not.toHaveBeenCalled()
  })
})
