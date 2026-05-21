import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullCommandInterface, fullCommandInterfaceYAML } from "./__fixtures__/full"
import { importCommandInterfaceFromYAML } from "./fromYAML"

describe("importCommandInterfaceFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandInterfaceFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import full command interface", () => {
    const result = importCommandInterfaceFromYAML(mockContext, mockRule, fullCommandInterfaceYAML)

    expect(result).toEqual(fullCommandInterface)
  })

  it("imports unknown command group as raw XML identifier", () => {
    const result = importCommandInterfaceFromYAML(mockContext, mockRule, {
      КоманднаяПанель: [
        {
          Команда: "0",
          Тип: "Auto",
          ГруппаКоманд: "CommandGroup.Печать" as never,
        },
      ],
    })

    expect(result).toEqual({
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
  })
})
