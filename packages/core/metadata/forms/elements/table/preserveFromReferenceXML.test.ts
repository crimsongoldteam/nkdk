import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { fullTable } from "./__fixtures__/data"
import { TableRules } from "./rules"
import type { Table } from "./types"

const baseTable = {
  itemType: "Table",
  name: "Таблица",
  dataPath: "Таблица",
  id: undefined,
} satisfies Table

function exportTable(params: { table?: Table; referenceTable?: Table }): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.table,
    referenceMetadata: params.referenceTable,
    rule: TableRules,
  }) as Record<string, unknown>
}

function expectPresentXmlKeyOrder(xml: Record<string, unknown>, expectedOrder: string[]): void {
  const keys = Object.keys(xml)
  const actualOrdered = keys.filter((key) => expectedOrder.includes(key))
  const expectedPresentOrder = expectedOrder.filter((key) => keys.includes(key))

  expect(expectedPresentOrder.length).toBeGreaterThan(0)
  expect(actualOrdered).toEqual(expectedPresentOrder)
}

describe("Table preserveFromReferenceXML", () => {
  it("экспортирует критичные XML-свойства таблицы в порядке 1С без reference", () => {
    const result = exportTable({ table: fullTable })

    expectPresentXmlKeyOrder(result, [
      "Representation",
      "ChangeRowSet",
      "ChangeRowOrder",
      "AutoInsertNewRow",
      "EnableStartDrag",
      "EnableDrag",
      "DataPath",
      "RowPictureDataPath",
      "RowsPicture",
      "CommandSet",
      "ContextMenu",
      "AutoCommandBar",
      "ExtendedTooltip",
      "SearchStringAddition",
      "ViewStatusAddition",
      "SearchControlAddition",
      "Events",
      "ChildItems",
    ])
  })

  it("сохраняет RowFilter, когда ключ есть в referenceMetadata со значением undefined", () => {
    const result = exportTable({
      table: baseTable,
      referenceTable: {
        ...baseTable,
        rowFilter: undefined,
      },
    })

    expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("не добавляет RowFilter без ключа в referenceMetadata", () => {
    const result = exportTable({
      table: {
        ...baseTable,
        name: "ЦеновыеГруппы",
        dataPath: "Объект.ЦеновыеГруппы",
      },
      referenceTable: {
        ...baseTable,
        name: "ЦеновыеГруппы",
        dataPath: "Объект.ЦеновыеГруппы",
      },
    })

    expect(result.RowFilter).toBeUndefined()
  })

  it("сохраняет Period и TopLevelParent, когда ключи есть в referenceMetadata", () => {
    const result = exportTable({
      table: {
        ...baseTable,
        name: "ДинамическийСписок",
        dataPath: "ДинамическийСписок",
      },
      referenceTable: {
        ...baseTable,
        name: "ДинамическийСписок",
        dataPath: "ДинамическийСписок",
        period: undefined,
        topLevelParent: undefined,
      },
    })

    expect(result.Period).toEqual({
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    })
    expect(result.TopLevelParent).toEqual({ "_xsi:nil": "true" })
  })

  it("не добавляет XML-only поля без referenceMetadata", () => {
    const result = exportTable({
      table: {
        ...baseTable,
        name: "ДинамическийСписок",
        dataPath: "ДинамическийСписок",
      },
    })

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
    expect(result.RowFilter).toBeUndefined()
  })
})
