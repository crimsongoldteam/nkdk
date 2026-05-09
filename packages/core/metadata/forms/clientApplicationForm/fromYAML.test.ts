import { describe, expect, it } from "vitest"

import {
  catalogFullClientApplicationForm,
  catalogFullClientApplicationFormYAML,
  customSettingsFolderClientApplicationForm,
  customSettingsFolderClientApplicationFormYAML,
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
} from "./__fixtures__/data"
import { documentFullClientApplicationFormFromYAML } from "./__fixtures__/documentFull"
import { documentFullClientApplicationFormYAML } from "./__fixtures__/documentFull.yaml"
import { mockContext } from "~/tests/mockContext"
import { ButtonGroup, ButtonGroupPartialYAML } from "../elements/buttonGroup/types"
import { Table } from "../elements/table/types"
import { importClientApplicationFormFromYAML } from "./fromYAML"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

type ClientApplicationFormWithCustomSettingsFolder = ClientApplicationForm & {
  customSettingsFolder?: string
}

describe("importClientApplicationFormFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, fullClientApplicationFormYAML, {
      commands: [],
      childItems: [{ name: "ПолеВвода1", itemType: "InputField" }],
      itemType: "ClientApplicationForm",
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
    })

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("imports catalog full YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, catalogFullClientApplicationFormYAML, {
      itemType: "ClientApplicationForm",
      synonym: { items: {} },
      comment: "",
      includeHelpInContents: false,
      commands: [],
      childItems: [
        {
          itemType: "Button",
          name: "ФормаКоманда1",
          type: "UsualButton",
          commandName: "Form.Command.Команда1",
        },
      ],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [
          {
            itemType: "CommandBarButton",
            name: "ФормаКоманда2",
            type: "CommandBarButton",
            commandName: "Form.Command.Команда1",
          },
        ],
      },
    })

    expect(result).toEqual(catalogFullClientApplicationForm)
  })

  it("imports document full YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, documentFullClientApplicationFormYAML, {
      itemType: "ClientApplicationForm",
      synonym: { items: {} },
      comment: "",
      includeHelpInContents: false,
      commands: [],
      childItems: [
        {
          itemType: "InputField",
          name: "Номер",
          contextMenu: {
            itemType: "ContextMenu",
            name: "НомерКонтекстноеМеню",
            childItems: [],
          },
          extendedTooltip: {
            itemType: "ExtendedTooltip",
            name: "НомерРасширеннаяПодсказка",
          },
        },
        {
          itemType: "Button",
          name: "Команда1",
          extendedTooltip: {
            itemType: "ExtendedTooltip",
            name: "Команда1РасширеннаяПодсказка",
          },
        },
      ],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [],
      },
    })

    expect(result).toEqual(documentFullClientApplicationFormFromYAML)
  })

  it("should import from form command bar", () => {
    // const button: Button = {
    //   name: "Кнопка1",
    //   itemType: "Button",
    // }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: "ButtonGroup",
      childItems: [],
    }

    const enterpriseData: ClientApplicationFormYAML = {
      Элементы: {
        ГруппаКнопок1: {
          Доступность: "Ложь",
          Элементы: {
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
            itemType: "ButtonGroup",
            enabled: false,
            childItems: [
              {
                name: "Кнопка1",
                itemType: "Button",
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
    //   itemType: "Button",
    // }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: "ButtonGroup",
      childItems: [],
    }

    const table: Table = {
      name: "Таблица1",
      itemType: "Table",
      multipleChoice: false,
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [buttonGroup],
      },
      childItems: [],
    }

    const enterpriseData: ClientApplicationFormYAML = {
      Элементы: {
        ГруппаКнопок1: {
          Доступность: "Ложь",
          Элементы: {
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
          itemType: "Table",
          multipleChoice: false,
          autoCommandBar: {
            itemType: "AutoCommandBar",
            autofill: true,
            childItems: [
              {
                name: "ГруппаКнопок1",
                itemType: "ButtonGroup",
                enabled: false,
                childItems: [
                  {
                    name: "Кнопка1",
                    itemType: "Button",
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

  it("imports CustomSettingsFolder from YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, customSettingsFolderClientApplicationFormYAML, {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [],
    })

    expect((result as ClientApplicationFormWithCustomSettingsFolder).customSettingsFolder).toBe(
      customSettingsFolderClientApplicationForm.customSettingsFolder
    )
  })
})
