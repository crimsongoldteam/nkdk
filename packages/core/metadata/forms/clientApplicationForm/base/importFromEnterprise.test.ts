import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { Button } from "../../elements/button/types"
import { ButtonGroup } from "../../elements/buttonGroup/types"
import { Table } from "../../elements/table/types"
import { importClientApplicationFormFromEnterprise } from "./importFromEnterprise"
import { ClientApplicationForm, ClientApplicationFormEnterprise } from "./types"

describe("importClientApplicationFormFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, undefined, { childItems: [] })

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, fullClientApplicationFormEnterprise, {
      childItems: [{ name: "ПолеВвода1", elementType: FormElementType.InputField }],
      autoCommandBar: { autofill: false, childItems: [] },
    })

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import from form command bar", () => {
    const button: Button = {
      name: "Кнопка1",
      elementType: FormElementType.Button,
    }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      elementType: FormElementType.ButtonGroup,
      childItems: [button],
    }

    const enterpriseData: ClientApplicationFormEnterprise = {
      Элементы: {
        Кнопка1: { ИмяКоманды: "Команда1" },
        ГруппаКнопок1: { Доступность: "Ложь" },
      },
    }

    const result = importClientApplicationFormFromEnterprise(mockСontext, enterpriseData, {
      childItems: [],
      autoCommandBar: {
        autofill: false,
        childItems: [buttonGroup],
      },
    })

    const expectedResult: ClientApplicationForm = {
      commands: [],
      childItems: [],
      autoCommandBar: {
        autofill: false,
        childItems: [
          {
            name: "ГруппаКнопок1",
            elementType: FormElementType.ButtonGroup,
            enabled: false,
            childItems: [
              {
                name: "Кнопка1",
                elementType: FormElementType.Button,
                commandName: "Команда1",
              },
            ],
          },
        ],
      },
    }

    expect(result).toEqual(expectedResult)
  })

  it("should import from table command bar", () => {
    const button: Button = {
      name: "Кнопка1",
      elementType: FormElementType.Button,
    }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      elementType: FormElementType.ButtonGroup,
      childItems: [button],
    }

    const table: Table = {
      name: "Таблица1",
      elementType: FormElementType.Table,
      multipleChoice: false,
      autoCommandBar: {
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

    const result = importClientApplicationFormFromEnterprise(mockСontext, enterpriseData, {
      childItems: [table],
    })

    const expectedResult: ClientApplicationForm = {
      commands: [],
      childItems: [
        {
          name: "Таблица1",
          elementType: FormElementType.Table,
          multipleChoice: false,
          autoCommandBar: {
            autofill: true,
            childItems: [
              {
                name: "ГруппаКнопок1",
                elementType: FormElementType.ButtonGroup,
                enabled: false,
                childItems: [
                  {
                    name: "Кнопка1",
                    elementType: FormElementType.Button,
                    commandName: "Команда1",
                  },
                ],
              },
            ],
          },
          childItems: [],
        },
      ],
    }

    expect(result).toEqual(expectedResult)
  })
})
