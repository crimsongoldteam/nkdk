import { describe, expect, it } from "vitest"
import {
  catalogFullClientApplicationForm,
  catalogFullClientApplicationFormYAML,
  customSettingsFolderClientApplicationForm,
  customSettingsFolderClientApplicationFormYAML,
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
  minimalClientApplicationForm,
  minimalClientApplicationFormYAML,
  reportFormClientApplicationForm,
  reportFormClientApplicationFormYAML,
} from "./__fixtures__/data"
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
import { documentFullClientApplicationFormYAML } from "./__fixtures__/documentFull.yaml"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportClientApplicationFormToYAML } from "./toYAML"
import { ClientApplicationForm } from "./types"
import type { ConfigurationContext } from "~/metadata/context/types"

describe("exportClientApplicationFormToYAML", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = exportClientApplicationFormToYAML(mockContext, undefined)

  //   expect(result).toBeUndefined()
  // })

  it("should export all fields to YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, fullClientApplicationForm)

    expect(yaml).toEqual(fullClientApplicationFormYAML)
  })

  it("exports form and command bar elements from one YAML source", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [
          {
            itemType: "Button",
            name: "Записать",
            type: "UsualButton",
            commandName: "Записать",
          },
        ],
      },
      childItems: [
        {
          itemType: "InputField",
          name: "Товар",
          dataPath: "Объект.Товар",
        },
      ],
    }

    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, form)

    expect(yaml).toEqual({
      КоманднаяПанель: {
        Элементы: {
          Записать: {
            Вид: "Кнопка",
            ИмяКоманды: "Записать",
          },
        },
      },
      Элементы: {
        Товар: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Товар",
        },
      },
    })
  })

  it("exports disabled auto command bar autofill to YAML", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
      childItems: [],
    }

    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, form)

    expect(yaml).toEqual({
      КоманднаяПанель: {
        Автозаполнение: "Ложь",
      },
    })
  })

  it("exports catalog full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, catalogFullClientApplicationForm)

    expect(yaml).toEqual(catalogFullClientApplicationFormYAML)
  })

  it("exports document full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, documentFullClientApplicationForm)

    expect(yaml).toEqual(documentFullClientApplicationFormYAML)
  })

  it("exports report form settings storage as a local form reference", () => {
    const context: ConfigurationContext = {
      ...mockContextToYAML,
      exportToYAML: {
        ...mockContextToYAML.exportToYAML!,
        metadataTargetOwners: [
          {
            itemType: "MetadataReport",
            name: "РасшифровкаСтатистики",
            owner: { root: "Report", objectName: "РасшифровкаСтатистики" },
          },
        ],
      },
    }
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [],
      settingsStorage: "Report.РасшифровкаСтатистики.Form.ФормаОтчета",
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml).toEqual({
      ХранилищеНастроек: "ФормаОтчета",
    })
  })

  it("exports report form settings storage as an external report form reference", () => {
    const context: ConfigurationContext = {
      ...mockContextToYAML,
      exportToYAML: {
        ...mockContextToYAML.exportToYAML!,
        metadataTargetOwners: [
          {
            itemType: "MetadataReport",
            name: "РегистрНалоговогоУчетаФедеральногоИнвестиционногоВычета",
            owner: { root: "Report", objectName: "РегистрНалоговогоУчетаФедеральногоИнвестиционногоВычета" },
          },
        ],
      },
    }
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [],
      settingsStorage: "Report.РегистрыНалоговогоУчета.Form.ФормаОтчета",
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml).toEqual({
      ХранилищеНастроек: "Отчет.РегистрыНалоговогоУчета.Форма.ФормаОтчета",
    })
  })

  it("should export minimal", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, minimalClientApplicationForm)

    expect(yaml).toEqual(minimalClientApplicationFormYAML)
  })

  it("exports CustomSettingsFolder to YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, customSettingsFolderClientApplicationForm)

    expect((yaml as typeof customSettingsFolderClientApplicationFormYAML).ГруппаПользовательскихНастроек).toBe(
      customSettingsFolderClientApplicationFormYAML.ГруппаПользовательскихНастроек
    )
  })

  it("omits report form Auto defaults when exporting YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, reportFormClientApplicationForm)

    expect(yaml).toEqual(reportFormClientApplicationFormYAML)
    expect(yaml).not.toHaveProperty("АвтоОтображениеСостояния")
    expect(yaml).not.toHaveProperty("РежимОтображенияРезультатаОтчета")
    expect(yaml).not.toHaveProperty("ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета")
  })
})
