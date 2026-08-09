import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { serializeYAMLDocument } from "../../yaml/export"
import { yamlScalarTagAt } from "../../yaml/scalarTags"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { collectStructuralYamlReferences } from "./structuralReferences"

registerCoreMetadata()

describe("fill value structural references", () => {
  it("uses the indexed canonical and rewrites only the fill value", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Получатель:
    Тип: Справочник.Контрагенты
    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик
`)
    const result = collect(parsed)

    expect(result).toMatchObject({
      ok: true,
      references: [
        {
          yamlPath: ["Реквизиты", "Получатель", "ЗначениеЗаполнения"],
          canonical: "Catalog.Контрагенты.Поставщик",
        },
      ],
    })
    if (!result.ok) throw new Error(result.message)
    result.references[0]?.stageCanonical("Catalog.Контрагенты.Покупатель")
    expect(parsed.data).toMatchObject({
      Реквизиты: { Получатель: { ЗначениеЗаполнения: "Справочник.Контрагенты.Поставщик" } },
    })
    result.references[0]?.commitStaged()
    expect(parsed.data).toMatchObject({
      Реквизиты: {
        Получатель: {
          Тип: "Справочник.Контрагенты",
          ЗначениеЗаполнения: "Справочник.Контрагенты.Покупатель",
        },
      },
    })
  })

  it("rewrites a tagged reference and preserves !xml", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Получатель:
    Тип: Справочник.ПолныеРоли
    ЗначениеЗаполнения: !xml Справочник.РолиИсполнителей.ПустаяСсылка
`)
    const result = collect(parsed)

    expect(result).toMatchObject({
      ok: true,
      references: [{ canonical: "Catalog.РолиИсполнителей.EmptyRef" }],
    })
    if (!result.ok) throw new Error(result.message)
    result.references[0]?.stageCanonical("Catalog.РолиСогласования.EmptyRef")
    result.references[0]?.commitStaged()

    const attributes = (parsed.data as Record<string, Record<string, Record<string, unknown>>>).Реквизиты
    const recipient = attributes.Получатель
    expect(yamlScalarTagAt(recipient, "ЗначениеЗаполнения")).toBe("xml")
    expect(serializeYAMLDocument(parsed.data).text).toContain(
      "ЗначениеЗаполнения: !xml Справочник.РолиСогласования.ПустаяСсылка",
    )
  })
})

function collect(parsed: ReturnType<typeof parseMetadataYaml>) {
  return collectStructuralYamlReferences({
    filePath: "/project/Справочник/Товары/Свойства.yaml",
    parsed,
    rule: MetadataCatalogRules,
    yaml: parsed.data,
    owner: { root: "Catalog", objectName: "Товары" },
    context: mockContext,
    runtime: createPropertyStructuralReferenceRuntime(),
  })
}
