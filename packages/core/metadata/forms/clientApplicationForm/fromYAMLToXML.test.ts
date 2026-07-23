import fs from "fs"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import { importFromYAML } from "../../../yaml/import"
import { mockContextToXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"

describe("convertClientApplicationFormFromYAMLToXML", () => {
  it("формирует описание и содержимое формы прямо из YAML", () => {
    const yamlPath = fileURLToPath(new URL("__fixtures__/sync/yaml/Формы/ФормаЭлемента/Форма.yaml", import.meta.url))
    const yaml = importFromYAML<ClientApplicationFormYAML>(fs.readFileSync(yamlPath, "utf8"))
    const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "fullMetadata.xml"
    )

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаЭлемента",
      referenceFormXML: referenceFormXML.Form,
      referenceMetadataXML: referenceMetadataXML.MetaDataObject,
    })

    expect(result.metadataXML.Form.Properties).toBeDefined()
    expect(result.formXML.ChildItems).toBeDefined()
    const childItems = Array.isArray(result.formXML.ChildItems)
      ? result.formXML.ChildItems
      : result.formXML.ChildItems?.ChildItem
    const firstChild = Array.isArray(childItems) ? childItems[0] : childItems
    expect(firstChild?.InputField?.ContextMenu).toBeDefined()
    expect(firstChild?.InputField?.ExtendedTooltip).toBeDefined()
  })

  it("формирует дополнительные колонки реквизита без модели", () => {
    const yaml = importFromYAML<ClientApplicationFormYAML>(
      [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Строка",
        "    ДополнительныеКолонки:",
        "      Список.Способы:",
        "        Реквизит1:",
        "          Тип: Строка",
      ].join("\n")
    )

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаСписка",
    })

    expect(result.formXML.Attributes?.Attribute).toEqual([
      expect.objectContaining({
        _name: "Объект",
        Columns: {
          AdditionalColumns: [
            {
              _table: "Список.Способы",
              Column: [expect.objectContaining({ _name: "Реквизит1" })],
            },
          ],
        },
      }),
    ])
  })

  it("сохраняет пустой контейнер реквизитов из reference XML", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Форма",
      referenceFormXML: { Attributes: undefined } as ClientApplicationFormXML,
    })

    expect(result.formXML.Attributes).toEqual({})
  })

  it("не добавляет служебные узлы таблицы без reference XML", () => {
    const dynamicList = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
        Элементы: { Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" } },
      } as ClientApplicationFormYAML,
      name: "ФормаСписка",
    })
    const ordinary = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: { Объект: { Тип: "СправочникОбъект.БонусныеПрограммыЛояльности" } },
        Элементы: { ЦеновыеГруппы: { Вид: "ТаблицаФормы", ПутьКДанным: "Объект.ЦеновыеГруппы" } },
      } as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })

    expect(firstTable(dynamicList.formXML)).not.toHaveProperty("Period")
    expect(firstTable(dynamicList.formXML)).not.toHaveProperty("TopLevelParent")
    expect(firstTable(ordinary.formXML)).not.toHaveProperty("RowFilter")
  })

  it("сохраняет служебные узлы таблицы из reference XML", () => {
    const period = {
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    }
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
        Элементы: { Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" } },
      } as ClientApplicationFormYAML,
      name: "ФормаСписка",
      referenceFormXML: {
        ChildItems: [
          {
            Table: {
              _name: "Список",
              _id: "1",
              Period: period,
              TopLevelParent: { "_xsi:nil": "true" },
              RowFilter: { "_xsi:nil": "true" },
            },
          },
        ],
      },
    })

    expect(firstTable(result.formXML)).toMatchObject({
      Period: period,
      TopLevelParent: { "_xsi:nil": "true" },
      RowFilter: { "_xsi:nil": "true" },
    })
  })

  it("сохраняет идентификаторы команд из reference XML по имени", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Команды: {
          Команда1: { Заголовок: "Команда один" },
          Команда2: { Заголовок: "Команда два" },
        },
      } as ClientApplicationFormYAML,
      name: "Форма",
      referenceFormXML: {
        Commands: {
          Command: [
            { _name: "Команда1", _id: "7" },
            { _name: "Команда2", _id: "9" },
          ],
        },
      },
    })

    expect(result.formXML.Commands?.Command).toEqual([
      expect.objectContaining({ _name: "Команда1", _id: "7" }),
      expect.objectContaining({ _name: "Команда2", _id: "9" }),
    ])
  })

  it("сохраняет пустое расширенное представление из reference metadata XML", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Минимальная",
      referenceMetadataXML: {
        Form: {
          _uuid: "11111111-1111-4111-8111-111111111111",
          Properties: {
            Name: "Минимальная",
            FormType: "Managed",
            ExtendedPresentation: "",
          },
        },
      },
    })

    expect(result.metadataXML.Form.Properties.ExtendedPresentation).toBe("")
  })
})

function firstTable(form: ClientApplicationFormXML): Record<string, unknown> {
  const childItems = Array.isArray(form.ChildItems) ? form.ChildItems : form.ChildItems?.ChildItem
  const first = Array.isArray(childItems) ? childItems[0] : childItems
  return first?.Table ?? {}
}
