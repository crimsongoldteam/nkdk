import { describe, expect, it } from "vitest"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import type { ClientApplicationFormYAML } from "./types"

describe("client application BaseForm projection", () => {
  it("selects the cf element tree and only explicitly borrowed named components", () => {
    const baseAttribute = { Тип: "CatalogObject.Товары" }
    const baseCommand = { Заголовок: { ru: "Основная команда" } }
    const baseParameter = { Тип: "string" }
    const baseYaml = {
      Элементы: {
        Группа: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеВвода", Ширина: 10 },
          },
        },
      },
      Реквизиты: {
        Объект: baseAttribute,
        ТолькоОснова: { Тип: "string" },
      },
      Команды: {
        Команда1: baseCommand,
      },
      Параметры: {
        Параметр1: baseParameter,
      },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Элементы: {
        СобственнаяГруппа: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеНадписи", Ширина: 20 },
            Дополнение: { Вид: "ПолеВвода" },
          },
        },
      },
      Реквизиты: {
        Объект: { Тип: "CatalogObject.ДругиеТовары" },
        СобственныйРеквизит: { Тип: "number" },
      },
      Команды: {
        Команда1: { Заголовок: { ru: "Команда расширения" } },
        СобственнаяКоманда: {},
      },
      Параметры: {
        Параметр1: { Тип: "number" },
        СобственныйПараметр: { Тип: "boolean" },
      },
    } as ClientApplicationFormYAML

    const projection = projectClientApplicationBaseForm({
      baseYaml,
      extensionYaml,
    })

    expect(projection.yaml).toEqual({
      Элементы: {
        Группа: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеВвода" },
          },
        },
      },
      Реквизиты: { Объект: baseAttribute },
      Команды: { Команда1: baseCommand },
      Параметры: { Параметр1: baseParameter },
    })
    expect(projection.explicitComponents).toEqual({
      attributes: new Set(["Объект"]),
      commands: new Set(["Команда1"]),
      parameters: new Set(["Параметр1"]),
    })
  })

  it("keeps every cf element when the external match is moved, has another kind, or is absent", () => {
    const baseYaml = {
      Элементы: {
        Группа: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеВвода" },
            ТолькоОснова: { Вид: "ПолеНадписи" },
          },
        },
      },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Элементы: {
        ДругаяВетка: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеНадписи" },
          },
        },
      },
    } as ClientApplicationFormYAML

    const projection = projectClientApplicationBaseForm({
      baseYaml,
      extensionYaml,
    })

    expect(projection.yaml.Элементы).toEqual(baseYaml.Элементы)
    expect(Object.keys(projection.yaml.Элементы?.Группа.Элементы ?? {})).toEqual([
      "Код",
      "ТолькоОснова",
    ])
  })

  it("rejects duplicate external element names from different branches", () => {
    const baseYaml = {
      Элементы: {
        Код: { Вид: "ПолеВвода" },
      },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Элементы: {
        ПерваяГруппа: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеВвода" },
          },
        },
        ВтораяГруппа: {
          Вид: "ОбычнаяГруппа",
          Элементы: {
            Код: { Вид: "ПолеНадписи" },
          },
        },
      },
    } as ClientApplicationFormYAML

    expect(() =>
      projectClientApplicationBaseForm({ baseYaml, extensionYaml })
    ).toThrow(/duplicate element name "Код"/)
  })
})
