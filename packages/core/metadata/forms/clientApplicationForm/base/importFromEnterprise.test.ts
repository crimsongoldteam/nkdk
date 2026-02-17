import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContext } from "~/tests/mockContext"
import { Button } from "../../elements/button/types"
import { ButtonGroup } from "../../elements/buttonGroup/types"
import { Table } from "../../elements/table/types"
import { importClientApplicationFormFromEnterprise } from "./importFromEnterprise"
import { ClientApplicationForm, ClientApplicationFormEnterprise } from "./types"

describe("importClientApplicationFormFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importClientApplicationFormFromEnterprise(mockContext, fullClientApplicationFormEnterprise, {
      childItems: [{ name: "ПолеВвода1", itemType: CollectionFormElementType.InputField }],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
    })

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import from form command bar", () => {
    const button: Button = {
      name: "Кнопка1",
      itemType: CollectionFormElementType.Button,
    }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: CollectionFormElementType.ButtonGroup,
      childItems: [button],
    }

    const enterpriseData: ClientApplicationFormEnterprise = {
      Элементы: {
        Кнопка1: { ИмяКоманды: "Команда1" },
        ГруппаКнопок1: { Доступность: "Ложь" },
      },
    }

    const result = importClientApplicationFormFromEnterprise(mockContext, enterpriseData, {
      childItems: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [buttonGroup],
      },
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
    const button: Button = {
      name: "Кнопка1",
      itemType: CollectionFormElementType.Button,
    }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: CollectionFormElementType.ButtonGroup,
      childItems: [button],
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

    const enterpriseData: ClientApplicationFormEnterprise = {
      Элементы: {
        Кнопка1: { ИмяКоманды: "Команда1" },
        ГруппаКнопок1: { Доступность: "Ложь" },
        Таблица1: { МножественныйВыбор: "Ложь" },
      },
    }

    const result = importClientApplicationFormFromEnterprise(mockContext, enterpriseData, {
      childItems: [table],
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
