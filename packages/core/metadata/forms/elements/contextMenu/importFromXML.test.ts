import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { mockСontext } from "~/tests/mockContext"
import { BaseElement } from "../baseElement/types"
import { importContextMenuFromXML } from "./importFromXML"
import { ContextMenuXML } from "./types"

describe("importContextMenuFromXML", () => {
  const parentElement: BaseElement = {
    elementType: FormElementType.InputField,
    name: "КакойТоЭлемент",
  }

  it("should return undefined when data is undefined", () => {
    const result = importContextMenuFromXML(mockСontext, undefined, parentElement)

    expect(result).toBeUndefined()
  })

  it("should import minimal to undefined if name is default", () => {
    const result = importContextMenuFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import minimal to object if name is not default", () => {
    const otherParentElement: BaseElement = {
      elementType: FormElementType.Button,
      name: "ДругойЭлемент",
    }

    const xmlData: ContextMenuXML = {
      elementType: FormElementType.FormGroup,
      name: "КакойТоЭлементКонтекстноеМеню",
    }

    const result = importContextMenuFromXML(mockСontext, xmlData, otherParentElement)

    expect(result).toBeDefined()
    expect(result?.name).toBe("КакойТоЭлементКонтекстноеМеню")
  })
})
