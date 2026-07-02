import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
import { ClientApplicationInterfaceRules } from "./rules"

import "./register"

describe("import ClientApplicationInterface from YAML", () => {
  it("imports sections, short panels, expanded panels and groups", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: ClientApplicationInterfaceRules,
      yaml: {
        Верх: [
          { Панель: "ПанельФункцийТекущегоРаздела" },
          { Панель: "ПанельОткрытых" },
          { Панель: "СтандартнаяПанель" },
        ],
        Лево: [
          {
            Панель: {
              Имя: "ПанельИстории",
              Высота: 1,
              Представление: "КартинкаСлеваИТекст",
            },
          },
          { Группа: { Элементы: [] } },
        ],
        Низ: [{ Панель: "ПанельРазделов" }],
      },
    })

    expect(result).toMatchObject({
      itemType: "ClientApplicationInterface",
      top: [
        { kind: "panel", uuid: "c933ac92-92cd-459d-81cc-e0c8a83ced99" },
        { kind: "panel", uuid: "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75" },
        { kind: "panel", uuid: "00000000-0000-0000-0000-000000000000" },
      ],
      left: [
        {
          kind: "panel",
          uuid: "b553047f-c9aa-4157-978d-448ecad24248",
          height: 1,
          spr: "PictureOnLeftAndText",
        },
        { kind: "group", items: [] },
      ],
      bottom: [{ kind: "panel", uuid: "13322b22-3960-4d68-93a6-fe2dd7f28ca3" }],
    })
  })
})
