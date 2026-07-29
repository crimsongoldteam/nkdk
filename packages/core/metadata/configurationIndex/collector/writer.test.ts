import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector, createDiscardingConfigurationIndexCollector } from "./writer"

const UUID = "00000000-0000-4000-8000-000000000001"

describe("configuration snapshot collector", () => {
  it("собирает одну содержательную entity и назначает путь задания", () => {
    const collector = createConfigurationIndexCollector()
    collector.setIdentity("Справочник.Товары", "uuid", UUID)
    collector.setIdentity("Справочник.Товары", "xmlName", "")
    collector.setXmlFlag("Справочник.Товары.Свойство.Тип", "xsiNil")

    expect(collector.fragment("Справочники/Товары.yaml")).toEqual({
      targetProjectPath: "Справочники/Товары.yaml",
      entities: [
        {
          logicalAddress: "Справочник.Товары",
          sourceProjectPath: "Справочники/Товары.yaml",
          identities: { uuid: UUID, xmlName: "" },
        },
        {
          logicalAddress: "Справочник.Товары.Свойство.Тип",
          sourceProjectPath: "Справочники/Товары.yaml",
          xml: { xsiNil: true },
        },
      ],
    })
  })

  it("не создаёт entity только из logicalAddress и пути", () => {
    expect(createConfigurationIndexCollector().fragment("Конфигурация.yaml").entities).toEqual([])
  })

  it("отклоняет разные значения одного поля", () => {
    const collector = createConfigurationIndexCollector()
    collector.setIdentity("Справочник.Товары", "xmlId", "one")

    expect(() => collector.setIdentity("Справочник.Товары", "xmlId", "two")).toThrow(
      "Конфликт logicalAddress Справочник.Товары"
    )
  })

  it("объединяет одинаковые наблюдения и отклоняет конфликт каждого поля", () => {
    const collector = createConfigurationIndexCollector()
    const address = "Справочник.Товары"

    collector.setIdentity(address, "uuid", UUID)
    collector.setIdentity(address, "uuid", UUID)
    expect(() => collector.setIdentity(address, "uuid", "00000000-0000-4000-8000-000000000002")).toThrow(
      "Конфликт logicalAddress"
    )

    collector.setIdentity(address, "xmlId", "same")
    collector.setIdentity(address, "xmlId", "same")
    expect(() => collector.setIdentity(address, "xmlId", "other")).toThrow("Конфликт logicalAddress")

    collector.setIdentity(address, "xmlName", "")
    collector.setIdentity(address, "xmlName", "")
    expect(() => collector.setIdentity(address, "xmlName", "other")).toThrow("Конфликт logicalAddress")

    for (const field of ["extended", "xsiNil", "explicitEmpty"] as const) {
      collector.setXmlFlag(address, field)
      collector.setXmlFlag(address, field)
    }
    for (const field of ["xsiType", "xmlText", "xmlPrefix"] as const) {
      collector.setXmlValue(address, field, "same")
      collector.setXmlValue(address, field, "same")
      expect(() => collector.setXmlValue(address, field, "other")).toThrow("Конфликт logicalAddress")
    }

    collector.setOmittedChildren(address, { kind: "names", names: ["Форма"] })
    collector.setOmittedChildren(address, { kind: "names", names: ["Форма"] })
    expect(() => collector.setOmittedChildren(address, { kind: "names", names: ["Макет"] })).toThrow(
      "Конфликт logicalAddress"
    )
  })

  it("проверяет обязательные идентификаторы и копирует omittedChildren", () => {
    const collector = createConfigurationIndexCollector()
    expect(() => collector.setIdentity("Объект", "uuid", "not-a-uuid")).toThrow("Некорректный UUID")
    expect(() => collector.setIdentity("Объект", "xmlId", "")).toThrow("Пустой xmlId")
    expect(() => collector.setOmittedChildren("Объект", { kind: "names", names: [] })).toThrow("Пустой список")

    const omittedChildren = { kind: "typedNames" as const, items: [{ xmlName: "Attribute", name: "Код" }] }
    collector.setOmittedChildren("Объект", omittedChildren)
    omittedChildren.items[0]!.name = "Изменён"

    expect(collector.fragment("Объект.yaml").entities[0]).toMatchObject({
      omittedChildren: { kind: "typedNames", items: [{ xmlName: "Attribute", name: "Код" }] },
    })
  })

  it("discarding collector не валидирует и не сохраняет наблюдения", () => {
    const collector = createDiscardingConfigurationIndexCollector()
    collector.setIdentity("Объект", "xmlId", "one")
    collector.setIdentity("Объект", "xmlId", "two")

    expect(collector.fragment("ignored.yaml")).toEqual({ targetProjectPath: "ignored.yaml", entities: [] })
  })
})
