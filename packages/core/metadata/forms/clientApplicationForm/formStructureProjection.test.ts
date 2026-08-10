import { describe, expect, it } from "vitest"
import {
  collectClientApplicationFormStructure,
  projectClientApplicationFormStructure,
} from "./formStructureProjection"

describe("проекция структуры формы", () => {
  const yaml = {
    Элементы: { Группа: { Элементы: { Поле: {} } } },
    Реквизиты: { Объект: {} },
    Команды: { Записать: {} },
    Параметры: { Режим: {} },
  }

  it("собирает все категории с YAML-путями", () => {
    const components = collectClientApplicationFormStructure(yaml)
    expect(components.map(({ componentKind, name }) => `${componentKind}:${name}`)).toEqual([
      "element:Группа", "element:Поле", "attribute:Объект", "command:Записать", "parameter:Режим",
    ])
    expect(components[1]?.yamlPath).toEqual(["Элементы", "Группа", "Элементы", "Поле"])
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
