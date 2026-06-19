import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { HomePageWorkAreaRules } from "./rules"

import "./register"

describe("import HomePageWorkArea from YAML", () => {
  it("accepts short role names in item visibility", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: HomePageWorkAreaRules,
      yaml: {
        ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
        ЛеваяКолонка: [
          {
            Форма: "CommonForm.НачалоРаботы",
            Высота: 100,
            Видимость: {
              Общее: "Истина",
              Роли: {
                Администратор: "Ложь",
                ПолныеПрава: "Истина",
              },
            },
          },
        ],
        ПраваяКолонка: [
          {
            Форма: "DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
            Высота: 10,
            Видимость: {
              Общее: "Ложь",
            },
          },
        ],
        ОтображениеКомандногоИнтерфейса: "Верх",
      },
    })

    expect(result).toMatchObject({
      itemType: "HomePageWorkArea",
      workingAreaTemplate: "TwoColumnsVariableWidth",
      leftColumn: [
        {
          visibility: {
            common: true,
            roles: {
              "Role.Администратор": false,
              "Role.ПолныеПрава": true,
            },
          },
        },
      ],
      maCommandInterfaceDisplays: "Top",
    })
  })

  it("rejects prefixed role names in item visibility", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: HomePageWorkAreaRules,
        yaml: {
          ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
          ЛеваяКолонка: [
            {
              Форма: "CommonForm.НачалоРаботы",
              Видимость: {
                Роли: {
                  "Role.Администратор": "Ложь",
                },
              },
            },
          ],
        },
      })
    ).toThrow('Неизвестный корень "Role"')
  })

  it("passes unknown enum values through unchanged", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: HomePageWorkAreaRules,
      yaml: {
        ШаблонРабочейОбласти: "FutureTemplate",
        ОтображениеКомандногоИнтерфейса: "FutureDisplay",
      },
    })

    expect(result).toMatchObject({
      workingAreaTemplate: "FutureTemplate",
      maCommandInterfaceDisplays: "FutureDisplay",
    })
  })
})
