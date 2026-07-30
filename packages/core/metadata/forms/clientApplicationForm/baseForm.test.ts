import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import {
  childSegmentUid,
  childUid,
} from "../../configurationIndex/logicalAddress"
import {
  createConfigurationIndexReader,
  snapshotConfigurationIndex,
  type ConfigurationIndexReader,
} from "../../configurationIndex/sharedSnapshot"
import { sampleSnapshot } from "../../configurationIndex/testData"
import type { ClientApplicationFormYAML } from "./types"
import { buildClientApplicationBaseForm } from "./baseForm"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"

const formAddress = "Справочник.Товары.Форма.ФормаЭлемента"

describe("client application BaseForm", () => {
  it("builds only the shared form projection without changing the external form", () => {
    const baseYaml = {
      Ширина: 80,
      Высота: 40,
      События: { ПриОткрытии: "ОткрытиеОсновы" },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Ширина: 100,
      События: { ПриОткрытии: "ОткрытиеРасширения" },
    } as ClientApplicationFormYAML

    const baseForm = buildClientApplicationBaseForm({
      context: mockContextToXML(),
      baseIndex: reader({ componentPath: "cf" }),
      baseYaml,
      extensionYaml,
      formName: "ФормаЭлемента",
    })
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: extensionYaml,
      name: "ФормаЭлемента",
      baseFormXML: baseForm,
    })

    expect(baseForm).not.toHaveProperty("_xmlns")
    expect(baseForm._version).toBe("2.20")
    expect(baseForm.Width).toBe(80)
    expect(baseForm).not.toHaveProperty("Height")
    expect(baseForm).not.toHaveProperty("Events")
    expect(result.formXML.BaseForm).toEqual(baseForm)
    expect(result.formXML.Width).toBe(100)
    expect(result.formXML.Events).toEqual({
      Event: [{
        _name: "OnOpen",
        "#text": "ОткрытиеРасширения",
      }],
    })
  })

  it("uses the canonical singleton name when indexed name output is empty", () => {
    const autoCommandBarAddress = childUid(
      formAddress,
      "Элемент",
      "ФормаКоманднаяПанель"
    )
    const baseIndex = reader({
      componentPath: "cf",
      identities: [xmlId(autoCommandBarAddress, "-1")],
      xmlNodes: [
        {
          logicalAddress: childUid(
            formAddress,
            "ЧастьФормы",
            "Содержимое"
          ),
          present: ["autoCommandBar"],
        },
        {
          logicalAddress: autoCommandBarAddress,
          aliases: { _name: "", name: "_name" },
          present: ["name"],
        },
      ],
    })
    const extensionIndex = reader({
      componentPath: "cfe/Расширение",
      xmlNodes: [
        {
          logicalAddress: childUid(
            formAddress,
            "ЧастьФормы",
            "Содержимое"
          ),
          present: ["autoCommandBar"],
        },
        {
          logicalAddress: autoCommandBarAddress,
          present: ["name"],
        },
      ],
    })
    const baseContext = mockContextToXML()
    const context = {
      ...baseContext,
      exportToXML: {
        ...baseContext.exportToXML,
        configurationIndex: createConfigurationIndexExportRuntime({
          source: extensionIndex,
          collector: createConfigurationIndexCollector(),
          targetProjectPath:
            "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
          logicalAddress: formAddress,
        }),
      },
    }
    const yaml = {} as ClientApplicationFormYAML

    const baseForm = buildClientApplicationBaseForm({
      context,
      baseIndex,
      baseYaml: yaml,
      extensionYaml: yaml,
      formName: "ФормаЭлемента",
    })

    expect(asRecord(baseForm.AutoCommandBar)?._name)
      .toBe("ФормаКоманднаяПанель")
  })

  it("uses indexed XML defaults while converting the base projection", () => {
    const listAttributeAddress = childUid(
      formAddress,
      "Атрибут",
      "Список"
    )
    const dynamicListAddress = childUid(
      listAttributeAddress,
      "Свойство",
      "ДинамическийСписок"
    )
    const baseIndex = reader({
      componentPath: "cf",
      identities: [
        xmlId(listAttributeAddress, "1"),
        xmlId(
          childUid(
            formAddress,
            "Элемент",
            "ФормаКоманднаяПанель"
          ),
          "-1"
        ),
      ],
      xmlNodes: [{
        logicalAddress: dynamicListAddress,
        order: ["customQuery", "mainTable"],
        present: ["customQuery"],
      }],
    })
    const extensionIndex = reader({
      componentPath: "cfe/Расширение",
      identities: [xmlId(listAttributeAddress, "1000001")],
    })
    const baseContext = mockContextToXML()
    const context = {
      ...baseContext,
      exportToXML: {
        ...baseContext.exportToXML,
        configurationIndex: createConfigurationIndexExportRuntime({
          source: extensionIndex,
          collector: createConfigurationIndexCollector(),
          targetProjectPath:
            "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
          logicalAddress: formAddress,
        }),
        xmlDefaultVariantByLogicalAddress: {
          [formAddress]: "adopted" as const,
        },
      },
    }
    const yaml = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ДинамическийСписок: {
            ОсновнаяТаблица: "Catalog.Товары",
          },
        },
      },
    } as ClientApplicationFormYAML

    const baseForm = buildClientApplicationBaseForm({
      context,
      baseIndex,
      baseYaml: yaml,
      extensionYaml: yaml,
      formName: "ФормаЭлемента",
    })

    expect(
      asRecord(
        asRecord(baseForm.Attributes?.Attribute?.[0])?.Settings
      )?.ManualQuery
    ).toBe(false)
  })

  it("rejects a borrowed table attribute when its cf column has no xmlId", () => {
    const tableAddress = childUid(
      formAddress,
      "Атрибут",
      "Таблица"
    )
    const columnAddress = childUid(
      tableAddress,
      "Колонка",
      "Значение"
    )
    const baseIndex = reader({
      componentPath: "cf",
      identities: [xmlId(tableAddress, "1")],
    })
    const extensionIndex = reader({
      componentPath: "cfe/Расширение",
      identities: [xmlId(tableAddress, "1000001")],
    })
    const baseContext = mockContextToXML()
    const context = {
      ...baseContext,
      exportToXML: {
        ...baseContext.exportToXML,
        configurationIndex: createConfigurationIndexExportRuntime({
          source: extensionIndex,
          collector: createConfigurationIndexCollector(),
          targetProjectPath:
            "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
          logicalAddress: formAddress,
        }),
      },
    }
    const yaml = {
      Реквизиты: {
        Таблица: {
          Тип: "ТаблицаЗначений",
          Колонки: {
            Значение: {
              Тип: "Строка",
            },
          },
        },
      },
    } as ClientApplicationFormYAML

    expect(() =>
      buildClientApplicationBaseForm({
        context,
        baseIndex,
        baseYaml: yaml,
        extensionYaml: yaml,
        formName: "ФормаЭлемента",
      })
    ).toThrow(columnAddress)
  })

  it("intersects state of nested items outside the root element tree", () => {
    const autoCommandBarAddress = childUid(
      formAddress,
      "Элемент",
      "ФормаКоманднаяПанель"
    )
    const buttonAddress = childUid(
      formAddress,
      "Элемент",
      "Кнопка"
    )
    const baseIndex = reader({
      componentPath: "cf",
      identities: [
        xmlId(autoCommandBarAddress, "-1"),
        xmlId(buttonAddress, "1"),
      ],
      xmlNodes: [
        {
          logicalAddress: childUid(
            formAddress,
            "ЧастьФормы",
            "Содержимое"
          ),
          present: ["autoCommandBar"],
        },
        {
          logicalAddress: autoCommandBarAddress,
          order: ["childItems", "name"],
        },
        {
          logicalAddress: buttonAddress,
          order: ["type", "commandName", "parameter", "name"],
        },
      ],
    })
    const extensionIndex = reader({
      componentPath: "cfe/Расширение",
      identities: [
        xmlId(autoCommandBarAddress, "-1"),
        xmlId(buttonAddress, "1"),
      ],
      xmlNodes: [
        {
          logicalAddress: childUid(
            formAddress,
            "ЧастьФормы",
            "Содержимое"
          ),
          order: ["autoCommandBar"],
        },
        {
          logicalAddress: autoCommandBarAddress,
          order: ["childItems", "name"],
        },
        {
          logicalAddress: buttonAddress,
          order: ["type", "commandName", "name"],
        },
      ],
    })
    const baseContext = mockContextToXML()
    const context = {
      ...baseContext,
      exportToXML: {
        ...baseContext.exportToXML,
        configurationIndex: createConfigurationIndexExportRuntime({
          source: extensionIndex,
          collector: createConfigurationIndexCollector(),
          targetProjectPath:
            "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
          logicalAddress: formAddress,
        }),
      },
    }
    const yaml = {
      КоманднаяПанель: {
        Элементы: {
          Кнопка: {
            Вид: "КнопкаКоманднойПанели",
            ТипКнопки: "КнопкаКоманднойПанели",
            ИмяКоманды: "0",
          },
        },
      },
    } as ClientApplicationFormYAML

    const baseForm = buildClientApplicationBaseForm({
      context,
      baseIndex,
      baseYaml: yaml,
      extensionYaml: yaml,
      formName: "ФормаЭлемента",
    })

    expect(
      asChildItemArray(
        asRecord(baseForm.AutoCommandBar)?.ChildItems
      )[0]?.Button
    ).not.toHaveProperty("Parameter")
  })

  it("does not treat the tree element kind as the XML button type", () => {
    const buttonAddress = childUid(
      formAddress,
      "Элемент",
      "Кнопка"
    )
    const baseIndex = reader({
      componentPath: "cf",
      identities: [xmlId(buttonAddress, "1")],
      xmlNodes: [{
        logicalAddress: buttonAddress,
        order: ["type", "name"],
      }],
    })
    const extensionIndex = reader({
      componentPath: "cfe/Расширение",
      identities: [xmlId(buttonAddress, "1")],
      xmlNodes: [{
        logicalAddress: buttonAddress,
        order: ["name"],
      }],
    })
    const baseContext = mockContextToXML()
    const context = {
      ...baseContext,
      exportToXML: {
        ...baseContext.exportToXML,
        configurationIndex: createConfigurationIndexExportRuntime({
          source: extensionIndex,
          collector: createConfigurationIndexCollector(),
          targetProjectPath:
            "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
          logicalAddress: formAddress,
        }),
      },
    }

    const baseForm = buildClientApplicationBaseForm({
      context,
      baseIndex,
      baseYaml: {
        Элементы: {
          Кнопка: {
            Вид: "Кнопка",
            ТипКнопки: "ОбычнаяКнопка",
          },
        },
      } as ClientApplicationFormYAML,
      extensionYaml: {
        Элементы: {
          Кнопка: {
            Вид: "Кнопка",
          },
        },
      } as ClientApplicationFormYAML,
      formName: "ФормаЭлемента",
    })

    expect(asChildItemArray(baseForm.ChildItems)[0]?.Button)
      .not.toHaveProperty("Type")
  })

  it("uses cf element state and cfe identities only for explicitly borrowed components", () => {
    const baseYaml = {
      Реквизиты: {
        Объект: { Тип: "Строка" },
        СкрытыйРеквизит: { Тип: "Строка" },
      },
      Команды: {
        СкрытаяКоманда: {},
      },
      Элементы: {
        Группа: {
          Вид: "Группа",
          Элементы: {
            Код: {
              Вид: "ПолеВвода",
              ПутьКДанным: "Объект",
            },
            НедоступныйПуть: {
              Вид: "ПолеВвода",
              ПутьКДанным: "СкрытыйРеквизит",
            },
            НедоступнаяКоманда: {
              Вид: "Кнопка",
              ИмяКоманды: "СкрытаяКоманда",
            },
          },
        },
      },
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Реквизиты: {
        Объект: { Тип: "Число" },
        СобственныйРеквизит: { Тип: "Строка" },
      },
      Команды: {
        СобственнаяКоманда: {},
      },
      Элементы: {
        НедоступнаяКоманда: {
          Вид: "Кнопка",
          ИмяКоманды: "СкрытаяКоманда",
        },
        Группа: {
          Вид: "Группа",
          Элементы: {
            НедоступныйПуть: {
              Вид: "ПолеВвода",
              ПутьКДанным: "СкрытыйРеквизит",
            },
            Код: {
              Вид: "ПолеВвода",
              ПутьКДанным: "Объект",
            },
          },
        },
        СобственныйЭлемент: {
          Вид: "ПолеНадписи",
        },
      },
    } as ClientApplicationFormYAML
    const elementAddresses = {
      group: childUid(formAddress, "Элемент", "Группа"),
      code: childUid(formAddress, "Элемент", "Код"),
      unavailableDataPath: childUid(
        formAddress,
        "Элемент",
        "НедоступныйПуть"
      ),
      unavailableCommand: childUid(
        formAddress,
        "Элемент",
        "НедоступнаяКоманда"
      ),
    }
    const attributeAddress = childUid(
      formAddress,
      "Атрибут",
      "Объект"
    )
    const baseIndex = reader({
      componentPath: "cf",
      identities: [
        xmlId(
          childUid(formAddress, "Элемент", "ФормаКоманднаяПанель"),
          "9"
        ),
        xmlId(elementAddresses.group, "10"),
        xmlId(
          childSegmentUid(
            elementAddresses.group,
            "РасширеннаяПодсказка"
          ),
          "100"
        ),
        xmlId(elementAddresses.code, "11"),
        xmlId(
          childSegmentUid(
            elementAddresses.code,
            "КонтекстноеМеню"
          ),
          "110"
        ),
        xmlId(
          childSegmentUid(
            elementAddresses.code,
            "РасширеннаяПодсказка"
          ),
          "111"
        ),
        xmlId(elementAddresses.unavailableDataPath, "12"),
        xmlId(
          childSegmentUid(
            elementAddresses.unavailableDataPath,
            "КонтекстноеМеню"
          ),
          "120"
        ),
        xmlId(
          childSegmentUid(
            elementAddresses.unavailableDataPath,
            "РасширеннаяПодсказка"
          ),
          "121"
        ),
        xmlId(elementAddresses.unavailableCommand, "13"),
        xmlId(
          childSegmentUid(
            elementAddresses.unavailableCommand,
            "РасширеннаяПодсказка"
          ),
          "130"
        ),
        xmlId(attributeAddress, "20"),
      ],
      xmlNodes: [{
        logicalAddress: elementAddresses.unavailableDataPath,
        order: ["dataPath"],
      }],
    })
    const extensionIndex = reader({
      componentPath: "cfe/Расширение",
      identities: [
        xmlId(
          childUid(formAddress, "Элемент", "ФормаКоманднаяПанель"),
          "1000009"
        ),
        xmlId(elementAddresses.group, "1000010"),
        xmlId(elementAddresses.code, "1000011"),
        xmlId(elementAddresses.unavailableDataPath, "1000012"),
        xmlId(elementAddresses.unavailableCommand, "1000013"),
        xmlId(attributeAddress, "1000020"),
      ],
      xmlNodes: [{
        logicalAddress: elementAddresses.unavailableDataPath,
        order: ["dataPath"],
      }],
    })
    const collector = createConfigurationIndexCollector()
    const baseContext = mockContextToXML()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source: extensionIndex,
      collector,
      targetProjectPath:
        "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      logicalAddress: formAddress,
    })
    const context = {
      ...baseContext,
      exportToXML: {
        ...baseContext.exportToXML,
        configurationIndex,
      },
    }

    const baseForm = buildClientApplicationBaseForm({
      context,
      baseIndex,
      baseYaml,
      extensionYaml,
      formName: "ФормаЭлемента",
    })

    expect(baseForm.Attributes?.Attribute).toEqual([
      expect.objectContaining({
        _name: "Объект",
        _id: "1000020",
      }),
    ])
    const rootItems = asChildItemArray(baseForm.ChildItems)
    expect(rootItems).toHaveLength(1)
    expect(rootItems[0]?.UsualGroup).toMatchObject({
      _name: "Группа",
      _id: "10",
    })
    const nestedItems = asChildItemArray(
      rootItems[0]?.UsualGroup?.ChildItems
    )
    expect(
      nestedItems.map((item) => {
        const element = Object.values(item)[0]
        return element?._name
      })
    ).toEqual(["Код", "НедоступныйПуть", "НедоступнаяКоманда"])
    expect(nestedItems[0]?.InputField).toMatchObject({
      _name: "Код",
      _id: "11",
      DataPath: "Объект",
    })
    expect(nestedItems[1]?.InputField).toMatchObject({
      _name: "НедоступныйПуть",
      _id: "12",
    })
    expect(nestedItems[1]?.InputField).not.toHaveProperty("DataPath")
    expect(nestedItems[2]?.Button).toMatchObject({
      _name: "НедоступнаяКоманда",
      _id: "13",
      CommandName: "0",
    })
    expect(baseForm.Commands).toBeUndefined()
    expect(JSON.stringify(baseForm)).not.toContain("СобственныйЭлемент")
    expect(JSON.stringify(baseForm)).not.toContain("СобственнаяКоманда")
  })

  it("does not add BaseForm details to the result index collector", () => {
    const collector = createConfigurationIndexCollector()
    const source = reader({
      componentPath: "cfe/Расширение",
      identities: [
        xmlId(
          childUid(
            formAddress,
            "Элемент",
            "ФормаКоманднаяПанель"
          ),
          "9"
        ),
      ],
    })
    const baseContext = mockContextToXML()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath:
        "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const context = {
      ...baseContext,
      exportToXML: { ...baseContext.exportToXML, configurationIndex },
    }

    buildClientApplicationBaseForm({
      context,
      baseIndex: source,
      baseYaml: { Ширина: 80 } as ClientApplicationFormYAML,
      extensionYaml: { Ширина: 100 } as ClientApplicationFormYAML,
      formName: "ФормаЭлемента",
    })

    expect(collector.fragment(configurationIndex.targetProjectPath))
      .toEqual({
        targetProjectPath:
          "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        entities: [],
      })
  })
})

function reader(params: {
  readonly componentPath: string
  readonly identities?: readonly LegacyIdentity[]
  readonly xmlNodes?: readonly unknown[]
  readonly xmlValues?: readonly unknown[]
}): ConfigurationIndexReader {
  const sample = sampleSnapshot()
  const identitiesByAddress = new Map<string, Record<string, string>>()
  for (const identity of params.identities ?? []) {
    const identities = identitiesByAddress.get(identity.logicalAddress) ?? {}
    identities[identity.kind] = identity.value
    identitiesByAddress.set(identity.logicalAddress, identities)
  }
  const source = createConfigurationIndexReader(
    snapshotConfigurationIndex(
      encodeConfigurationIndex({
        ...sample,
        componentPath: params.componentPath,
        entities: [
          ...sample.entities,
          ...[...identitiesByAddress].map(([logicalAddress, identities]) => ({
            logicalAddress,
            sourceProjectPath: "Configuration.yaml",
            identities,
          })),
        ],
      })
    )
  )
  return source
}

function xmlId(
  logicalAddress: string,
  value: string
): LegacyIdentity {
  return { logicalAddress, kind: "xmlId", value }
}

interface LegacyIdentity {
  readonly logicalAddress: string
  readonly kind: "uuid" | "xmlId" | "xmlName"
  readonly value: string
}

function asChildItemArray(value: unknown): Array<Record<string, any>> {
  if (Array.isArray(value)) return value as Array<Record<string, any>>
  if (value === null || typeof value !== "object") return []
  const childItem = (value as { ChildItem?: unknown }).ChildItem
  if (Array.isArray(childItem)) {
    return childItem as Array<Record<string, any>>
  }
  return childItem === undefined
    ? []
    : [childItem as Record<string, any>]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
