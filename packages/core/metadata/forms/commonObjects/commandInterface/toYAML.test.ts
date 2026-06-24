import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullCommandInterface, fullCommandInterfaceYAML } from "./__fixtures__/full"
import { exportCommandInterfaceToYAML } from "./toYAML"

describe("exportCommandInterfaceToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, {
      NavigationPanel: [],
      CommandBar: [],
      itemType: "CommandInterface",
    })

    expect(result).toBeUndefined()
  })

  it("should export full command interface", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, fullCommandInterface)

    expect(result).toEqual(fullCommandInterfaceYAML)
  })

  it("exports unknown command group as raw XML identifier", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, {
      itemType: "CommandInterface",
      NavigationPanel: [],
      CommandBar: [
        {
          itemType: "CommandInterfaceItem",
          command: "0",
          type: "Auto",
          commandGroup: "CommandGroup.Печать",
        },
      ],
    })

    expect(result).toEqual({
      КоманднаяПанель: [
        {
          Команда: "0",
          Тип: "Auto",
          ГруппаКоманд: "CommandGroup.Печать",
        },
      ],
    })
  })
})
