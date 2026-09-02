import { describe, expect, it } from "vitest"
import {
  createConfigurationIndexCollector,
  withConfigurationIndexCollector,
} from "@nkdk/runtime"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
  withDirectMetadataExecution,
} from "../../../../tests/directConversion"
import { mockContext, mockContextFromXML } from "../../../../tests/mockContext"
import { exportJSONSchemaGraph } from "../../../projectDefinition/schemaRegistry"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import {
  ChartOfAccountsPredefinedItemRules,
  ChartOfAccountsPredefinedRules,
} from "./rules"

describe("предопределённые счета XML → YAML → XML", () => {
  it("сохраняет свойства плана счетов у вложенного счёта", () => {
    const contexts = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: ChartOfAccountsPredefinedRules,
      xml: SOURCE_XML,
    })

    expect(imported.yaml).toMatchObject({
      items: {
        ОсновныеСредства: {
          Элементы: {
            ОСвОрганизации: {
              ВидСчета: "Активный",
              Забалансовый: "Истина",
              Порядок: "01.01",
              ПризнакиУчета: {
                "ChartOfAccounts.Хозрасчетный.AccountingFlag.Налоговый": {
                  Значение: "Истина",
                },
              },
              ВидыСубконто: {
                "ChartOfCharacteristicTypes.ВидыСубконто.Номенклатура": {
                  Оборотный: "Истина",
                },
              },
            },
          },
        },
      },
    })

    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: ChartOfAccountsPredefinedRules,
      yaml: imported.yaml,
    })

    expect(exported.xml).toEqual(SOURCE_XML)
    expect(exported.xml).not.toHaveProperty("Item.0.ChildItems.Item.0.IsFolder")
  })

  it("сохраняет прежний сегмент адреса вложенного счёта", () => {
    const index = createConfigurationIndexCollector()
    const logicalAddress = "ChartOfAccounts.Хозрасчетный.Predefined"
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      index,
      logicalAddress,
    )

    testPropertyFromXMLToYAML({
      context,
      rule: ChartOfAccountsPredefinedRules,
      xml: SOURCE_XML,
    })

    expect(index.fragment("ПланСчетов/Хозрасчетный/Свойства.yaml").entities).toContainEqual({
      logicalAddress:
        `${logicalAddress}.Предопределенный.ОсновныеСредства.Предопределенный.ОСвОрганизации`,
      uuid: "22222222-2222-4222-8222-222222222222",
    })
  })

  it("проверяет специфичные поля у вложенного счёта по JSON Schema", () => {
    const graph = withDirectMetadataExecution(() => exportJSONSchemaGraph({
      context: mockContext,
      roots: [{ key: "account", rule: ChartOfAccountsPredefinedItemRules }],
    }))
    const check = compileValidationSchema(graph.schemas, graph.roots.account!)

    expect(check.Check({
      Код: "01",
      Наименование: "Основные средства",
      Элементы: {
        ОСвОрганизации: {
          Код: "01.01",
          Наименование: "Основные средства организации",
          ВидСчета: "Активный",
          Забалансовый: "Истина",
        },
      },
    })).toBe(true)
    expect(check.Check({
      Код: "01",
      Наименование: "Основные средства",
      Элементы: {
        ОСвОрганизации: {
          Код: "01.01",
          Наименование: "Основные средства организации",
          Забалансовый: "не булево",
        },
      },
    })).toBe(false)
  })
})

const SOURCE_XML = {
  Item: [{
    _id: "11111111-1111-4111-8111-111111111111",
    Name: "ОсновныеСредства",
    Code: "01",
    Description: "Основные средства",
    AccountType: "ActivePassive",
    OffBalance: false,
    Order: "01",
    AccountingFlags: {
      Flag: [{
        _ref: "ChartOfAccounts.Хозрасчетный.AccountingFlag.Налоговый",
        "#text": false,
      }],
    },
    ExtDimensionTypes: { ExtDimensionType: [] },
    ChildItems: {
      Item: [{
        _id: "22222222-2222-4222-8222-222222222222",
        Name: "ОСвОрганизации",
        Code: "01.01",
        Description: "Основные средства организации",
        AccountType: "Active",
        OffBalance: true,
        Order: "01.01",
        AccountingFlags: {
          Flag: [{
            _ref: "ChartOfAccounts.Хозрасчетный.AccountingFlag.Налоговый",
            "#text": true,
          }],
        },
        ExtDimensionTypes: {
          ExtDimensionType: [{
            _name: "ChartOfCharacteristicTypes.ВидыСубконто.Номенклатура",
            Turnover: true,
            AccountingFlags: {
              Flag: [{
                _ref: "ChartOfAccounts.Хозрасчетный.ExtDimensionAccountingFlag.Налоговый",
                "#text": false,
              }],
            },
          }],
        },
      }],
    },
  }],
} as const
