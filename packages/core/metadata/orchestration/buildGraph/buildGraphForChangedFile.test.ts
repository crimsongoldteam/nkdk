import { describe, expect, it } from "vitest"
import { buildGraphForChangedFile as publicBuildGraphForChangedFile } from "../../../index"
import { buildGraphForChangedFile as defaultBuildGraphForChangedFile } from "~/metadata/graphImport/buildGraph"
import { ensureDefaultGraphImportsRegistered } from "~/metadata/graphImport/registerDefaultGraphImports"
import { buildGraphForChangedFile } from "./buildGraphForChangedFile"
import type { ImportContext } from "./types"

ensureDefaultGraphImportsRegistered()

const ctx: ImportContext = { version: "2.20", defaultLanguage: "ru" }

describe("buildGraphForChangedFile", () => {
  it("для Форма.yaml объявляет визуальные элементы в том же файле", async () => {
    const result = await buildGraphForChangedFile({
      projectPath: "/project",
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      text: [
        "Элементы:",
        "  ПолеВвода1:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Реквизит",
        "    Ширина: 10",
        "",
      ].join("\n"),
      context: ctx,
    })

    const yaml = result.find((file) => file.filePath.endsWith("Форма.yaml"))
    expect(yaml?.declaredNodeIds?.some((id) => id.includes(".Элемент."))).toBe(true)
    expect(yaml?.edges.some((edge) => edge.tgt.includes(".Элемент."))).toBe(true)
  })

  it("строит сегмент одного Свойства.yaml и declaredNodeIds содержит корень", async () => {
    const result = await buildGraphForChangedFile({
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
        label: "MetadataObject",
        props: expect.objectContaining({ kind: "MetadataCatalog" }),
      }),
    )
  })

  it("строит Форма.yaml с ownerNodeId из пути и declaredNodeIds содержит form node", async () => {
    const result = await buildGraphForChangedFile({
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
    expect(result[0]!.edges).toContainEqual(
      expect.objectContaining({
        src: "Справочник.Контрагенты",
        tgt: "Справочник.Контрагенты.Форма.ФормаСписка",
        kind: "FORM",
      }),
    )
  })

  it("возвращает [] для неподдержанного пути", async () => {
    const result = await buildGraphForChangedFile({
      projectPath: "/tmp/project",
      filePath: "Случайный/Файл.yaml",
      text: "Имя: x\n",
      context: ctx,
    })

    expect(result).toEqual([])
  })

  it("экспортируется из корневого API @nakidka/core", () => {
    expect(publicBuildGraphForChangedFile).toBe(defaultBuildGraphForChangedFile)
  })
})
