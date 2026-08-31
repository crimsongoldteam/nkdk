import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
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
      "document:", "element:Группа", "element:Поле", "attribute:Объект", "command:Записать", "parameter:Режим",
      "mainAttribute:Объект",
    ])
    expect(components.find(({ name }) => name === "Поле")?.yamlPath)
      .toEqual(["Элементы", "Группа", "Элементы", "Поле"])
    expect(components.find(({ componentKind, name }) => componentKind === "element" && name === "Поле"))
      .toMatchObject({ payload: JSON.stringify({ version: 1, primaryDataPath: "missing" }) })
    expect(components).toContainEqual({
      componentKind: "mainAttribute",
      name: "Объект",
      yamlPath: ["Реквизиты", "Объект", "ОсновнойРеквизит"],
    })
  })

  it("добавляет роль и topology-адрес документа", () => {
    const projected = projectClientApplicationFormStructure({
      components: collectClientApplicationFormStructure(yaml),
      representation: "base",
      logicalAddress: "Catalog.Товары.Form.ФормаЭлемента",
      workingProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    })

    expect(projected).toEqual(expect.arrayContaining([
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
    const documents = projected.filter(({ componentKind }) => componentKind === "document")
    expect(documents).toHaveLength(1)
    expect(JSON.parse(documents[0]?.payload ?? "null")).toEqual({
      version: 1,
      yaml,
    })
  })
})
