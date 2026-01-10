import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { importContextMenuFromEnterprise } from "./importFromEnterprise"
import { ContextMenuEnterprise } from "./types"

describe("importContextMenuFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importContextMenuFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const enterpriseData: ContextMenuEnterprise = {
      Имя: "ТестовоеМеню",
      Видимость: "Да",
    }

    const result = importContextMenuFromEnterprise(mockСontext, enterpriseData)

    expect(result).toBeDefined()
    expect(result?.name).toBe("ТестовоеМеню")
  })

  it("should import minimal", () => {
    const enterpriseData: ContextMenuEnterprise = {
      Имя: "МинимальноеМеню",
    }

    const result = importContextMenuFromEnterprise(mockСontext, enterpriseData)

    expect(result).toBeDefined()
    expect(result?.name).toBe("МинимальноеМеню")
  })
})
