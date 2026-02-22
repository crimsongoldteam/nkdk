import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import {
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContext } from "~/tests/mockContext"
import { ButtonGroup, ButtonGroupPartialYAML } from "../elements/buttonGroup/types"
import { Table } from "../elements/table/types"
import { importClientApplicationFormFromYAML } from "./fromYAML"
import { ClientApplicationFormYAML, ClientApplicationForm } from "./types"

describe("importClientApplicationFormFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, fullClientApplicationFormYAML, {
      commands: [],
      childItems: [{ name: "ПолеВвода1", itemType: CollectionFormElementType.InputField }],
      itemType: "ClientApplicationForm",
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
    })

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import from form command bar", () => {
    // const button: Button = {
    //   name: "Кнопка1",
    //   itemType: CollectionFormElementType.Button,
    // }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: CollectionFormElementType.ButtonGroup,
      childItems: [],
    }

    const enterpriseData: ClientApplicationFormYAML = {
      ПодчиненныеЭлементы: {
        ГруппаКнопок1: {
          Доступность: "Ложь",
          ПодчиненныеЭлементы: {
            Кнопка1: {
              Тип: "Кнопка",
              ИмяКоманды: "Команда1",
            },
          },
        } as ButtonGroupPartialYAML,
      },
    }

    const result = importClientApplicationFormFromYAML(mockContext, enterpriseData, {
      commands: [],
      childItems: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [buttonGroup],
      },
      itemType: "ClientApplicationForm",
    })

    const expectedResult: ClientApplicationForm = {
      commands: [],
      childItems: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [
          {
            name: "ГруппаКнопок1",
            itemType: CollectionFormElementType.ButtonGroup,
            enabled: false,
            childItems: [
              {
                name: "Кнопка1",
                itemType: CollectionFormElementType.Button,
                commandName: "Команда1",
              },
            ],
          },
        ],
      },
      itemType: "ClientApplicationForm",
    }

    expect(result).toEqual(expectedResult)
  })

  it("should import from table command bar", () => {
    // const button: Button = {
    //   name: "Кнопка1",
    //   itemType: CollectionFormElementType.Button,
    // }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: CollectionFormElementType.ButtonGroup,
      childItems: [],
    }

    const table: Table = {
      name: "Таблица1",
      itemType: CollectionFormElementType.Table,
      multipleChoice: false,
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [buttonGroup],
      },
      childItems: [],
    }

    const enterpriseData: ClientApplicationFormYAML = {
      ПодчиненныеЭлементы: {
        ГруппаКнопок1: {
          Доступность: "Ложь",
          ПодчиненныеЭлементы: {
            Кнопка1: { Тип: "Кнопка", ИмяКоманды: "Команда1" },
          },
        } as ButtonGroupPartialYAML,
        Таблица1: { МножественныйВыбор: "Ложь" },
      },
    }

    const result = importClientApplicationFormFromYAML(mockContext, enterpriseData, {
      childItems: [table],
      itemType: "ClientApplicationForm",
      commands: [],
    })

    const expectedResult: ClientApplicationForm = {
      commands: [],
      childItems: [
        {
          name: "Таблица1",
          itemType: CollectionFormElementType.Table,
          multipleChoice: false,
          autoCommandBar: {
            itemType: "AutoCommandBar",
            autofill: true,
            childItems: [
              {
                name: "ГруппаКнопок1",
                itemType: CollectionFormElementType.ButtonGroup,
                enabled: false,
                childItems: [
                  {
                    name: "Кнопка1",
                    itemType: CollectionFormElementType.Button,
                    commandName: "Команда1",
                  },
                ],
              },
            ],
          },
          childItems: [],
        },
      ],
      itemType: "ClientApplicationForm",
    }

    expect(result).toEqual(expectedResult)
  })
})
