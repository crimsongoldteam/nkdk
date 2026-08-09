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

  it("preserves !xml when renaming a tagged fill-value reference", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Исполнитель:
    Тип: Справочник.ПолныеРоли
    ЗначениеЗаполнения: !xml Справочник.РолиИсполнителей.СтараяРоль
`)
    const result = collect(parsed)

    if (!result.ok) throw new Error(result.message)
    expect(result.references).toHaveLength(1)
    result.references[0]?.stageCanonical("Catalog.РолиИсполнителей.НоваяРоль")
    result.references[0]?.commitStaged()

    const attribute = (parsed.data as { Реквизиты: { Исполнитель: Record<string, unknown> } })
      .Реквизиты.Исполнитель
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
    expect(serializeYAMLDocument(parsed.data).text).toContain(
      "ЗначениеЗаполнения: !xml Справочник.РолиИсполнителей.НоваяРоль"
    )
  })

  it("preserves !xml when renaming a tagged empty owner reference", () => {
    const parsed = parseMetadataYaml(`Владельцы: []
СтандартныеРеквизиты:
  Владелец:
    ЗначениеЗаполнения: !xml Справочник.ПапкиФайлов.ПустаяСсылка
`)
    const result = collect(parsed)

    if (!result.ok) throw new Error(result.message)
    expect(result.references).toHaveLength(1)
    result.references[0]?.stageCanonical("Catalog.КаталогиФайлов.EmptyRef")
    result.references[0]?.commitStaged()

    const attribute = (parsed.data as { СтандартныеРеквизиты: { Владелец: Record<string, unknown> } })
      .СтандартныеРеквизиты.Владелец
    expect(attribute.ЗначениеЗаполнения).toBe("!xml Справочник.КаталогиФайлов.ПустаяСсылка")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
    expect(serializeYAMLDocument(parsed.data).text).toContain(
      "ЗначениеЗаполнения: !xml Справочник.КаталогиФайлов.ПустаяСсылка"
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
