import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { mockСontext } from "~/tests/mockContext"
import { exportContextMenuToEnterprise } from "./exportToEnterprise"
import { ContextMenu } from "./types"

describe("exportContextMenuToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportContextMenuToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const contextMenu: ContextMenu = {
      elementType: FormElementType.FormGroup,
      name: "ТестовоеМеню",
      visible: true,
    }

    const result = exportContextMenuToEnterprise(mockСontext, contextMenu)

    expect(result).toBeDefined()
    expect(result?.Имя).toBe("ТестовоеМеню")
  })

  it("should export minimal", () => {
    const contextMenu: ContextMenu = {
      elementType: FormElementType.FormGroup,
      name: "МинимальноеМеню",
    }

    const result = exportContextMenuToEnterprise(mockСontext, contextMenu)

    expect(result).toBeDefined()
    expect(result?.Имя).toBe("МинимальноеМеню")
  })
})
