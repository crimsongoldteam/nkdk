import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { mockСontext } from "~/tests/mockContext"
import { exportContextMenuToXML } from "./exportToXML"
import { ContextMenu } from "./types"

describe("exportContextMenuToXML", () => {
  const parentElement: BaseElement = {
    elementType: FormElementType.InputField,
    name: "КакойТоЭлемент",
  }

  it("should return default when data is undefined", () => {
    const xmlData = exportContextMenuToXML(mockСontext, undefined, parentElement)

    expect(xmlData).toBeDefined()
    expect(xmlData.name).toBe("КакойТоЭлементКонтекстноеМеню")
  })

  it("should return content when data is provided", () => {
    const contextMenu: ContextMenu = {
      elementType: FormElementType.FormGroup,
      name: "КакойТоЭлементКонтекстноеМеню",
      enabled: true,
    }

    const xmlData = exportContextMenuToXML(mockСontext, contextMenu, parentElement)

    expect(xmlData).toBeDefined()
    expect(xmlData.name).toBe("КакойТоЭлементКонтекстноеМеню")
    expect(xmlData.Enabled).toBe(true)
  })
})
