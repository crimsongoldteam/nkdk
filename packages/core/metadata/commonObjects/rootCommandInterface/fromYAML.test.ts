import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
import { RootCommandInterfaceRules } from "./rules"

import "./register"

describe("import RootCommandInterface from YAML", () => {
  it("imports subsystem visibility and command settings", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: RootCommandInterfaceRules,
      yaml: {
        ВидимостьПодсистем: {
          "Subsystem.ПодсистемаПоУмолчанию": {
            Общее: "Ложь",
            Роли: {
              Администратор: "Ложь",
            },
          },
        },
        ПорядокПодсистем: ["Подсистема.ПодсистемаПоУмолчанию"],
        ВидимостьКоманд: [
          {
            Команда: "Catalog.СправочникПолный.Command.ПоУмолчанию",
            Общее: "Истина",
          },
        ],
        РазмещениеКоманд: [
          {
            Команда: "Catalog.СправочникПолный.Command.ПоУмолчанию",
            ГруппаКоманд: "ПанельНавигацииОбычное",
            Размещение: "Вручную",
          },
        ],
        ПорядокКоманд: [
          {
            Команда: "Catalog.СправочникПолный.Command.ПоУмолчанию",
            ГруппаКоманд: "ПанельНавигацииОбычное",
          },
        ],
        ПорядокГрупп: ["ПанельНавигацииОбычное"],
      },
    })

    expect(result).toEqual({
      itemType: "RootCommandInterface",
      subsystemsVisibility: {
        "Subsystem.ПодсистемаПоУмолчанию": {
          common: false,
          roles: {
            "Role.Администратор": false,
          },
        },
      },
      subsystemsOrder: ["Subsystem.ПодсистемаПоУмолчанию"],
      commandsVisibility: [
        {
          command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          visibility: {
            common: true,
          },
        },
      ],
      commandsPlacement: [
        {
          command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          commandGroup: "NavigationPanelOrdinary",
          placement: "Manual",
        },
      ],
      commandsOrder: [
        {
          command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          commandGroup: "NavigationPanelOrdinary",
        },
      ],
      groupsOrder: ["NavigationPanelOrdinary"],
    })
  })

  it("rejects prefixed and opaque role visibility keys", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: RootCommandInterfaceRules,
        yaml: {
          ВидимостьПодсистем: {
            "Subsystem.ПодсистемаПоУмолчанию": {
              Роли: {
                "Роль.Администратор": "Ложь",
              },
            },
          },
        },
      })
    ).toThrow("Ожидалось имя объекта без корня, потому что корень задан правилом")

    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: RootCommandInterfaceRules,
        yaml: {
          ВидимостьПодсистем: {
            "Subsystem.ПодсистемаПоУмолчанию": {
              Роли: {
                "ЛокальныйПуть.НачалоРаботы": "Ложь",
              },
            },
          },
        },
      })
    ).toThrow('Неизвестный корень "ЛокальныйПуть"')
  })

  it("keeps unknown command groups and uuid-like command names unchanged", () => {
    const uuidCommand = "0:2f109eaa-d341-4592-a04f-3f199e75d879"

    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: RootCommandInterfaceRules,
      yaml: {
        ВидимостьКоманд: [
          {
            Команда: uuidCommand,
            Общее: "Истина",
          },
        ],
        ПорядокКоманд: [
          {
            Команда: uuidCommand,
            ГруппаКоманд: "CommandGroup.ГруппаКомандПоУмолчанию",
          },
        ],
        ПорядокГрупп: ["CommandGroup.ГруппаКомандПоУмолчанию"],
      },
    })

    expect(result?.commandsVisibility).toEqual([{ command: uuidCommand, visibility: { common: true } }])
    expect(result?.commandsOrder?.[0]).toEqual({
      command: uuidCommand,
      commandGroup: "CommandGroup.ГруппаКомандПоУмолчанию",
    })
    expect(result?.groupsOrder).toEqual(["CommandGroup.ГруппаКомандПоУмолчанию"])
  })
})
