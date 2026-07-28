import { describe, expect, it } from "vitest"
import { InputFieldRules } from "../elements/inputField/rules"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import type { ClientApplicationFormYAML } from "./types"

describe("client application BaseForm projection", () => {
  it("selects the cf element tree and only explicitly borrowed named components", () => {
    const baseAttribute = {
      Тип: "CatalogObject.Товары",
      НеизвестноеСвойство: "Основа",
    }
    const baseCommand = { Заголовок: { ru: "Основная команда" } }
    const baseParameter = { Тип: "string" }
    const baseYaml = {
      Элементы: {
        Группа: {
          Вид: "Группа",
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
          Вид: "Группа",
          Элементы: {
            Код: { Вид: "ПолеНадписи", Ширина: 20 },
            Дополнение: { Вид: "ПолеВвода" },
          },
        },
      },
      Реквизиты: {
        Объект: {
          Тип: "CatalogObject.ДругиеТовары",
          НеизвестноеСвойство: "Расширение",
        },
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
          Вид: "Группа",
          Элементы: {
            Код: { Вид: "ПолеВвода", Ширина: 10 },
          },
        },
      },
      Реквизиты: {
        Объект: { Тип: "CatalogObject.Товары" },
      },
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
          Вид: "Группа",
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
          Вид: "Группа",
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
    expect(Object.keys(projection.yaml.Элементы?.Группа.Элементы ?? {})).toEqual(["Код", "ТолькоОснова"])
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
          Вид: "Группа",
          Элементы: {
            Код: { Вид: "ПолеВвода" },
          },
        },
        ВтораяГруппа: {
          Вид: "Группа",
          Элементы: {
            Код: { Вид: "ПолеНадписи" },
          },
        },
      },
    } as ClientApplicationFormYAML

    expect(() => projectClientApplicationBaseForm({ baseYaml, extensionYaml })).toThrow(/duplicate element name "Код"/)
  })

  it("projects scalar, nested, and event properties by their YAML keys", () => {
    const baseYaml = {
      Ширина: 100,
      Высота: 50,
      Заголовок: { ru: "Основная форма", en: "Base form" },
      События: { ПриОткрытии: "ОсновнойОбработчик" },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Ширина: 200,
      Группировка: "Горизонтальная",
      Заголовок: { ru: "Форма расширения", de: "Extension form" },
      События: { ПриОткрытии: "ОбработчикРасширения" },
    } as ClientApplicationFormYAML

    const projection = projectClientApplicationBaseForm({
      baseYaml,
      extensionYaml,
    })

    expect(projection.yaml).toEqual({
      Ширина: 100,
      Заголовок: { ru: "Основная форма" },
    })
  })

  it("omits an empty nested intersection unless the rule declares empty XML", () => {
    const projection = projectClientApplicationBaseForm({
      baseYaml: {
        Реквизиты: { ТолькоОснова: { Тип: "Строка" } },
        Команды: { ТолькоОснова: {} },
      } as ClientApplicationFormYAML,
      extensionYaml: {
        Реквизиты: { ТолькоРасширение: { Тип: "Строка" } },
        Команды: { ТолькоРасширение: {} },
      } as ClientApplicationFormYAML,
    })

    expect(projection.yaml).toEqual({ Реквизиты: {} })
  })

  it("preserves a nested tree property exposed through its YAML alias", () => {
    const button = {
      Вид: "КнопкаКоманднойПанели",
      ТипКнопки: "КнопкаКоманднойПанели",
    } as const
    const projection = projectClientApplicationBaseForm({
      baseYaml: {
        КоманднаяПанель: {
          Элементы: { Команда: button },
        },
      } as ClientApplicationFormYAML,
      extensionYaml: {
        КоманднаяПанель: {
          Элементы: { Команда: button },
        },
      } as ClientApplicationFormYAML,
    })

    expect(projection.yaml.КоманднаяПанель?.Элементы).toEqual({
      Команда: button,
    })
  })

  it("uses the cf kind rule and the external kind rule when intersecting properties", () => {
    const baseYaml = {
      Элементы: {
        Код: {
          Вид: "ПолеВвода",
          Ширина: 10,
          КнопкаВыбора: true,
        },
      },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Элементы: {
        Код: {
          Вид: "ПолеНадписи",
          Ширина: 20,
          КнопкаВыбора: false,
        },
      },
    } as ClientApplicationFormYAML

    const projection = projectClientApplicationBaseForm({
      baseYaml,
      extensionYaml,
    })

    expect(projection.yaml.Элементы).toEqual({
      Код: {
        Вид: "ПолеВвода",
        Ширина: 10,
      },
    })
  })

  it("projects DataPath and CommandName against explicitly selected components", () => {
    const baseYaml = {
      Реквизиты: {
        Объект: { Тип: "CatalogObject.Товары" },
        СкрытыйРеквизит: { Тип: "string" },
      },
      Команды: {
        Команда1: {},
        СкрытаяКоманда: {},
      },
      Элементы: {
        ДоступныйПуть: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Код",
        },
        НедоступныйПуть: {
          Вид: "ПолеВвода",
          ПутьКДанным: "СкрытыйРеквизит.Код",
        },
        ДоступнаяКоманда: {
          Вид: "Кнопка",
          ИмяКоманды: "Команда1",
        },
        НедоступнаяКоманда: {
          Вид: "Кнопка",
          ИмяКоманды: "СкрытаяКоманда",
        },
      },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Реквизиты: {
        Объект: { Тип: "CatalogObject.ДругиеТовары" },
      },
      Команды: {
        Команда1: {},
      },
      Элементы: {
        ДоступныйПуть: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Артикул",
        },
        НедоступныйПуть: {
          Вид: "ПолеВвода",
          ПутьКДанным: "СкрытыйРеквизит.Код",
        },
        ДоступнаяКоманда: {
          Вид: "Кнопка",
          ИмяКоманды: "Команда1",
        },
        НедоступнаяКоманда: {
          Вид: "Кнопка",
          ИмяКоманды: "СкрытаяКоманда",
        },
      },
    } as ClientApplicationFormYAML

    const projection = projectClientApplicationBaseForm({
      baseYaml,
      extensionYaml,
    })

    expect(projection.yaml.Элементы).toEqual({
      ДоступныйПуть: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Объект.Код",
      },
      НедоступныйПуть: {
        Вид: "ПолеВвода",
      },
      ДоступнаяКоманда: {
        Вид: "Кнопка",
        ИмяКоманды: "Команда1",
      },
      НедоступнаяКоманда: {
        Вид: "Кнопка",
        ИмяКоманды: "0",
      },
    })
  })

  it("rejects an unavailable reference without registered projection behavior", () => {
    const properties = InputFieldRules.properties as Record<string, unknown>
    properties.unregisteredReference = {
      type: "UnregisteredAttributeReference",
      yaml: "ИскусственнаяСсылка",
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Attribute"],
      },
    }

    try {
      const baseYaml = {
        Элементы: {
          Код: {
            Вид: "ПолеВвода",
            ИскусственнаяСсылка: "СкрытыйРеквизит",
          },
        },
      } as ClientApplicationFormYAML
      const extensionYaml = {
        Элементы: {
          Код: {
            Вид: "ПолеВвода",
            ИскусственнаяСсылка: "СкрытыйРеквизит",
          },
        },
      } as ClientApplicationFormYAML

      expect(() => projectClientApplicationBaseForm({ baseYaml, extensionYaml })).toThrow(
        /UnregisteredAttributeReference/
      )
    } finally {
      delete properties.unregisteredReference
    }
  })
})
