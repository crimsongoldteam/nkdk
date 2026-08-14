import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "@nkdk/runtime"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { collectStructuralYamlReferences } from "./structuralReferences"
import { createPropertyRuleRegistrySet, withPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../composition/metadataRules"


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
    ЗначениеЗаполнения: !xml/value Справочник.РолиИсполнителей.СтараяРоль
`)
    const result = collect(parsed)

    if (!result.ok) throw new Error(result.message)
    expect(result.references).toHaveLength(1)
    result.references[0]?.stageCanonical("Catalog.РолиИсполнителей.НоваяРоль")
    result.references[0]?.commitStaged()

    const attribute = (parsed.data as { Реквизиты: { Исполнитель: Record<string, unknown> } })
      .Реквизиты.Исполнитель
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
    expect(serializeYAMLDocument(parsed.data).text).toContain(
      "ЗначениеЗаполнения: !xml/value Справочник.РолиИсполнителей.НоваяРоль"
    )
  })

  it("preserves !xml when renaming a tagged empty owner reference", () => {
    const parsed = parseMetadataYaml(`Владельцы: []
СтандартныеРеквизиты:
  Владелец:
    ЗначениеЗаполнения: !xml/value Справочник.ПапкиФайлов.ПустаяСсылка
`)
    const result = collect(parsed)

    if (!result.ok) throw new Error(result.message)
    expect(result.references).toHaveLength(1)
    result.references[0]?.stageCanonical("Catalog.КаталогиФайлов.EmptyRef")
    result.references[0]?.commitStaged()

    const attribute = (parsed.data as { СтандартныеРеквизиты: { Владелец: Record<string, unknown> } })
      .СтандартныеРеквизиты.Владелец
    expect(attribute.ЗначениеЗаполнения).toBe("!xml/value Справочник.КаталогиФайлов.ПустаяСсылка")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml/value")
    expect(serializeYAMLDocument(parsed.data).text).toContain(
      "ЗначениеЗаполнения: !xml/value Справочник.КаталогиФайлов.ПустаяСсылка"
    )
  })

  it("не добавляет транспортный DesignTimeRef в граф ссылок", () => {
    const parsed = parseMetadataYaml(`Реквизиты:\n  Получатель:\n    Тип: Справочник.Контрагенты\n    ЗначениеЗаполнения: !xml/reference 447e2bd8-fa43-442e-91db-b17634e036d9.c26f06ab-fb3e-46a7-a391-fdccd77b4231\n`)
    const result = withPropertyRuleRegistrySet(
      createPropertyRuleRegistrySet(metadataRules),
      () => collect(parsed),
    )

    expect(result).toMatchObject({ ok: true, references: [] })
  })

  it("не проверяет очищенную ссылку, отмеченную режимом PropertyState", () => {
    const parsed = parseMetadataYaml("ОсновнаяФормаСписка: !изменять\n")

    expect(collect(parsed)).toMatchObject({ ok: true, references: [] })
  })

  it("не проверяет естественное пустое значение plain-ссылки", () => {
    const parsed = parseMetadataYaml('ОсновнаяФормаСписка: ""\n')

    expect(collect(parsed)).toMatchObject({ ok: true, references: [] })
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
