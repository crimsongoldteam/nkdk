import "~/metadata/appliedObjects"
import "~/metadata/forms"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { clearJSONSchemaRefRegistries } from "~/metadata/orchestration/jsonSchemaRefs"
import { exportJSONSchemaForSchemaName, listJSONSchemaNames } from "~/metadata/validation/schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("JSON Schema registry", () => {
  it("exports compact named schemas by schema name", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataAttribute" })
    const json = JSON.stringify(schema)

    expect(json).toContain('"Тип"')
    expect(json).not.toContain("MetadataCatalog")
  })

  it("keeps catalog attribute collection refs precise", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataCatalog" })

    expect(JSON.stringify(schema)).toContain("nkdk://schema/MetadataCatalogAttribute")
  })

  it("exports catalog attribute schema with short-form type branch", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataCatalogAttribute" })
    const json = JSON.stringify(schema)

    expect(schema).toMatchObject({
      anyOf: [
        expect.any(Object),
        expect.objectContaining({
          properties: expect.objectContaining({
            Тип: expect.any(Object),
          }),
        }),
      ],
    })
    expect(json).toContain("Справочник")
    expect(json).toContain('"Тип"')
  })

  it("exports form element schemas with Вид discriminator", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "InputField" })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
      }),
      required: expect.arrayContaining(["Вид"]),
    })
  })

  it("keeps tree YAML button type alias away from Вид discriminator", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "Button" })

    expect(schema).toMatchObject({
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "Кнопка" }),
        ТипКнопки: expect.any(Object),
      }),
    })
  })

  it("exports nested child items as refs by default", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup" })
    const json = JSON.stringify(schema)

    expect(json).toContain("nkdk://schema/InputField")
    expect(json).not.toContain('"ПутьКДанным"')
  })

  it("exports nested child items inline in inline mode", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })
    const json = JSON.stringify(schema)

    expect(json).not.toContain("nkdk://schema/InputField")
    expect(json).toContain('"Элементы"')
    expect(json).toContain('"ПутьКДанным"')
  })

  it("compiles inline child item schemas with TypeBox compiler", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })

    expect(() => TypeCompiler.Compile(schema)).not.toThrow()
  })

  it("accepts nested child items in inline form element schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Вид: "Группа",
      Элементы: {
        Группа: {
          Вид: "Группа",
          Элементы: {
            Поле: {
              Вид: "ПолеВвода",
            },
          },
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("restores property refs after generic ref registry is cleared", () => {
    clearJSONSchemaRefRegistries()
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup" })

    expect(JSON.stringify(schema)).toContain("nkdk://schema/InputField")
  })

  it("reports unknown schema names", () => {
    expect(() => exportJSONSchemaForSchemaName({ context, name: "UnknownSchema" })).toThrow(
      /Неизвестная JSON Schema "UnknownSchema"/
    )
  })

  it("lists known schema names", () => {
    expect(listJSONSchemaNames()).toEqual(
      expect.arrayContaining(["MetadataAttribute", "MetadataCatalogAttribute", "InputField", "Table"])
    )
  })
})
