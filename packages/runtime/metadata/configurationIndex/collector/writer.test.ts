import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector, createDiscardingConfigurationIndexCollector } from "./writer"
import { createXmlImportAttemptJournal } from "../../ruleRuntime/xmlAnomaly/attempt"

const UUID = "00000000-0000-4000-8000-000000000001"

describe("configuration index collector", () => {
  it("собирает только закрытый набор полей BlockV2", () => {
    const collector = createConfigurationIndexCollector()
    collector.setIdentity("Справочник.Товары", "uuid", UUID)
    collector.setIdentity("Справочник.Товары", "xmlId", "1")
    collector.setChildren("Справочник.Товары.Свойство.ДочерниеОбъекты", [
      { xmlName: "Form", name: "ФормаЭлемента" },
    ])
    collector.setXmlValue("Справочник.Товары.fillValue", "TypeId.ValueId")

    const fragment = collector.fragment("Справочники/Товары.yaml")
    expect(fragment).toEqual({
      targetProjectPath: "Справочники/Товары.yaml",
      entities: [
        { logicalAddress: "Справочник.Товары", uuid: UUID, xmlId: "1" },
        { logicalAddress: "Справочник.Товары.fillValue", xmlValue: "TypeId.ValueId" },
        {
          logicalAddress: "Справочник.Товары.Свойство.ДочерниеОбъекты",
          children: [{ xmlName: "Form", name: "ФормаЭлемента" }],
        },
      ],
    })
    for (const entity of fragment.entities) {
      expect(Object.keys(entity).sort()).toEqual(
        ["children", "logicalAddress", "uuid", "xmlId", "xmlValue"].filter((key) => key in entity).sort(),
      )
    }
  })

  it("не создаёт entity только из logicalAddress и пути", () => {
    expect(createConfigurationIndexCollector().fragment("Конфигурация.yaml").entities).toEqual([])
  })

  it("объединяет одинаковые наблюдения и отклоняет конфликт", () => {
    const collector = createConfigurationIndexCollector()
    const address = "Справочник.Товары"
    collector.setIdentity(address, "uuid", UUID)
    collector.setIdentity(address, "uuid", UUID)
    expect(() => collector.setIdentity(address, "uuid", "00000000-0000-4000-8000-000000000002")).toThrow(
      "Конфликт logicalAddress",
    )
    collector.setChildren(address, [{ xmlName: "Form", name: "А" }])
    collector.setChildren(address, [{ xmlName: "Form", name: "А" }])
    expect(() => collector.setChildren(address, [{ xmlName: "Form", name: "Б" }])).toThrow(
      "Конфликт logicalAddress",
    )
    collector.setXmlValue(address, "one")
    expect(() => collector.setXmlValue(address, "two")).toThrow("Конфликт logicalAddress")
  })

  it("проверяет идентификаторы и копирует children", () => {
    const collector = createConfigurationIndexCollector()
    expect(() => collector.setIdentity("Объект", "uuid", "not-a-uuid")).toThrow("Некорректный UUID")
    expect(() => collector.setIdentity("Объект", "xmlId", "")).toThrow("Пустой xmlId")
    expect(() => collector.setChildren("Объект", [])).toThrow("Пустой список")

    const children = [{ xmlName: "Attribute", name: "Код" }]
    collector.setChildren("Объект", children)
    children[0]!.name = "Изменён"
    expect(collector.fragment("Объект.yaml").entities[0]).toMatchObject({
      children: [{ xmlName: "Attribute", name: "Код" }],
    })
  })

  it("discarding collector не валидирует и не сохраняет наблюдения", () => {
    const collector = createDiscardingConfigurationIndexCollector()
    collector.setIdentity("Объект", "xmlId", "one")
    collector.setIdentity("Объект", "xmlId", "two")
    collector.setChildren("Объект", [])
    collector.setXmlValue("Объект", "ignored")
    expect(collector.fragment("ignored.yaml")).toEqual({ targetProjectPath: "ignored.yaml", entities: [] })
  })

  it("откатывает только записи текущей попытки и фиксирует успешную", () => {
    const collector = createConfigurationIndexCollector()
    collector.setIdentity("Справочник.Товары", "uuid", UUID)
    const journal = createXmlImportAttemptJournal([collector])
    const failed = journal.begin()
    collector.setIdentity("Справочник.Товары", "xmlId", "temporary")
    collector.setChildren("Справочник.Товары.Свойство.ДочерниеОбъекты", [
      { xmlName: "Form", name: "Временная" },
    ])
    failed.rollback()

    const successful = journal.begin()
    collector.setIdentity("Справочник.Товары", "xmlId", "stable")
    successful.commit()

    expect(collector.fragment("Справочники/Товары.yaml").entities).toEqual([
      { logicalAddress: "Справочник.Товары", uuid: UUID, xmlId: "stable" },
    ])
  })

  it("сохраняет точный nested checkpoint даже без записей", () => {
    const collector = createConfigurationIndexCollector()
    const journal = createXmlImportAttemptJournal([collector])
    const outer = journal.begin()
    const inner = journal.begin()

    expect(() => outer.commit()).toThrow("порядок XML-import attempts")
    inner.rollback()
    collector.setIdentity("Справочник.Товары", "xmlId", "outer")
    outer.rollback()

    expect(collector.fragment("Справочники/Товары.yaml").entities).toEqual([])
  })
})
