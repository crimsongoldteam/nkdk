import { describe, expect, it } from "vitest"
import { buildGraphForChangedFile } from "./buildGraphForChangedFile"
import type { ImportContext } from "./types"

const ctx: ImportContext = { version: "2.20", defaultLanguage: "ru" }

describe("buildGraphForChangedFile", () => {
  it("строит сегмент одного Свойства.yaml и declaredNodeIds содержит корень", () => {
    const result = buildGraphForChangedFile({
      projectPath: "/tmp/project",
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      text: "ДлинаКода: 9\n",
      context: ctx,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      declaredNodeIds: expect.arrayContaining(["Справочник.Контрагенты"]),
    })
    expect(result[0]!.nodes).toContainEqual(
      expect.objectContaining({
        id: "Справочник.Контрагенты",
        label: "MetadataCatalog",
      }),
    )
  })

  it("строит Форма.yaml с ownerNodeId из пути и declaredNodeIds содержит form node", () => {
    const result = buildGraphForChangedFile({
      projectPath: "/tmp/project",
      filePath: "Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml",
      text: "Реквизиты: {}\n",
      context: ctx,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      filePath: "Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml",
      declaredNodeIds: expect.arrayContaining([
        "Справочник.Контрагенты.Форма.ФормаСписка",
      ]),
    })
    expect(result[0]!.nodes).toContainEqual(
      expect.objectContaining({
        id: "Справочник.Контрагенты.Форма.ФормаСписка",
        label: "ClientApplicationForm",
      }),
    )
  })

  it("возвращает [] для неподдержанного пути", () => {
    const result = buildGraphForChangedFile({
      projectPath: "/tmp/project",
      filePath: "Случайный/Файл.yaml",
      text: "Имя: x\n",
      context: ctx,
    })

    expect(result).toEqual([])
  })
})
