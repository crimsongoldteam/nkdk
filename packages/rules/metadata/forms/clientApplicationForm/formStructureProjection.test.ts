import { describe, expect, it } from "vitest"
import {
  collectClientApplicationFormStructure,
  projectClientApplicationFormStructure,
} from "./formStructureProjection"

describe("проекция структуры формы", () => {
  const yaml = {
    Элементы: { Группа: { Вид: "Группа", Элементы: { Поле: { Вид: "ПолеВвода" } } } },
    Реквизиты: { Объект: { ОсновнойРеквизит: "Истина" } },
    Команды: { Записать: {} },
    Параметры: { Режим: {} },
  }

  it("собирает все категории с YAML-путями", () => {
    const components = collectClientApplicationFormStructure(yaml)
    expect(components.map(({ componentKind, name }) => `${componentKind}:${name}`)).toEqual([
      "element:Группа", "element:Поле", "attribute:Объект", "command:Записать", "parameter:Режим",
      "mainAttribute:Объект",
    ])
    expect(components[1]?.yamlPath).toEqual(["Элементы", "Группа", "Элементы", "Поле"])
    expect(components.find(({ componentKind, name }) => componentKind === "element" && name === "Поле"))
      .toMatchObject({ payload: JSON.stringify({ version: 1, primaryDataPath: "missing" }) })
    expect(components).toContainEqual({
      componentKind: "mainAttribute",
      name: "Объект",
      yamlPath: ["Реквизиты", "Объект", "ОсновнойРеквизит"],
    })
  })

  it("добавляет роль и topology-адрес документа", () => {
    expect(projectClientApplicationFormStructure({
      components: collectClientApplicationFormStructure(yaml),
      representation: "base",
      logicalAddress: "Catalog.Товары.Form.ФормаЭлемента",
      workingProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    })).toEqual(expect.arrayContaining([
      {
        documentKind: "clientApplicationForm",
        representation: "base",
        logicalAddress: "Catalog.Товары.Form.ФормаЭлемента",
        workingProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        componentKind: "command",
        name: "Записать",
        yamlPath: ["Команды", "Записать"],
      },
    ]))
  })
})
