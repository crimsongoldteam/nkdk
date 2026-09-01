import { parseXmlDocumentWithSaxes, xmlElementRawValue } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { transformedXmlRootsAreExact } from "./xmlProofVerification"

const sourcePath = "/source/Ext/Form.xml"

describe("XML proof verification", () => {
  it("удаляет добавленный экспортом вложенный узел по physical XML-пути", () => {
    expect(verifySettingsRemoval("<Form><Attribute/></Form>")).toBe(true)
  })

  it("учитывает согласованное исключение присутствующего исходного узла", () => {
    const source = parseXmlDocumentWithSaxes("<Root><Empty/></Root>")
    const exported = parseXmlDocumentWithSaxes("<Root/>")

    expect(transformedXmlRootsAreExact({
      sourcePath,
      source,
      exported,
      transformations: [{
        sourcePath,
        side: "source",
        xmlPath: "/Root[1]/Empty[1]",
        value: null,
        hasSemanticValue: false,
      }],
    })).toBe(true)
  })

  it("не скрывает независимое остаточное расхождение", () => {
    expect(verifySettingsRemoval("<Form><Attribute/><Future/></Form>")).toBe(false)
  })

  it("проверяет поправку порядка дочерних узлов корня без замены корня", () => {
    const source = parseXmlDocumentWithSaxes("<Form><A/><B/></Form>")
    const exported = parseXmlDocumentWithSaxes("<Form><B/><A/></Form>")

    expect(transformedXmlRootsAreExact({
      sourcePath,
      source,
      exported,
      transformations: [{
        sourcePath,
        side: "exported",
        xmlPath: "/Form[1]",
        value: { "#order": ["A", "B"] },
        hasSemanticValue: true,
      }],
    })).toBe(true)
  })

  it("проверяет вложенные перекрывающиеся proof-поправки от дочерней к родительской", () => {
    const source = parseXmlDocumentWithSaxes("<Form><Item><Child><A/></Child><B/></Item></Form>")
    const exported = parseXmlDocumentWithSaxes("<Form><Item><Child/><C/></Item></Form>")
    const sourceItem = source.roots[0]!.content.find(
      (node) => node.type === "element" && node.name === "Item",
    )
    if (sourceItem === undefined || sourceItem.type !== "element") throw new Error("Не найден Item")
    const sourceChild = sourceItem.content.find(
      (node) => node.type === "element" && node.name === "Child",
    )
    if (sourceChild === undefined || sourceChild.type !== "element") throw new Error("Не найден Child")

    expect(transformedXmlRootsAreExact({
      sourcePath,
      source,
      exported,
      transformations: [
        {
          sourcePath,
          side: "exported",
          xmlPath: "/Form[1]/Item[1]",
          value: xmlElementRawValue(sourceItem),
          hasSemanticValue: false,
        },
        {
          sourcePath,
          side: "exported",
          xmlPath: "/Form[1]/Item[1]/Child[1]",
          value: xmlElementRawValue(sourceChild),
          hasSemanticValue: false,
        },
      ],
    })).toBe(true)
  })

  it("не принимает преобразование всего корня за точечную границу", () => {
    const source = parseXmlDocumentWithSaxes("<Form/>")

    expect(() => transformedXmlRootsAreExact({
      sourcePath,
      source,
      exported: source,
      transformations: [{
        sourcePath,
        side: "exported",
        xmlPath: "/Form[1]",
        value: null,
        hasSemanticValue: false,
      }],
    })).toThrow("корень XML-документа")
  })
})

function verifySettingsRemoval(sourceXml: string): boolean {
  return transformedXmlRootsAreExact({
    sourcePath,
    source: parseXmlDocumentWithSaxes(sourceXml),
    exported: parseXmlDocumentWithSaxes("<Form><Attribute><Settings/></Attribute></Form>"),
    transformations: [{
      sourcePath,
      side: "exported",
      xmlPath: "/Form[1]/Attribute[1]/Settings[1]",
      value: null,
      hasSemanticValue: false,
    }],
  })
}
