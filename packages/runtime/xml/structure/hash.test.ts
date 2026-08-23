import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import { hashXmlElementStructure } from "./hash"

describe("структурный XML-hash", () => {
  it("учитывает порядок атрибутов и типы содержимого", () => {
    const attributes = [
      { name: "b", value: "2" },
      { name: "a", value: "1" },
    ] as const
    const reversed = [...attributes].reverse()
    const text = hashXmlElementStructure({
      name: "Root",
      attributes,
      content: [{ type: "text", value: "2" }],
    })

    expect(typeof text).toBe("bigint")
    expect(
      hashXmlElementStructure({
        name: "Root",
        attributes: reversed,
        content: [{ type: "text", value: "2" }],
      })
    ).not.toBe(text)
    expect(
      hashXmlElementStructure({
        name: "Root",
        attributes,
        content: [{ type: "element", structuralHash: 2n }],
      })
    ).not.toBe(text)
    expect(
      hashXmlElementStructure({
        name: "Other",
        attributes,
        content: [{ type: "text", value: "2" }],
      })
    ).not.toBe(text)
    expect(
      hashXmlElementStructure({
        name: "Root",
        attributes,
        content: [
          { type: "element", structuralHash: 3n },
          { type: "element", structuralHash: 2n },
        ],
      })
    ).not.toBe(
      hashXmlElementStructure({
        name: "Root",
        attributes,
        content: [
          { type: "element", structuralHash: 2n },
          { type: "element", structuralHash: 3n },
        ],
      })
    )
  })

  it("не зависит от nodeId, пути и координат одинаковых элементов", () => {
    const document = parseXmlDocumentWithSaxes(
      "<Root><Value>x</Value><Padding/><Value><![CDATA[x]]></Value></Root>"
    )
    const values = document.roots[0]?.content.filter(
      (node): node is Extract<typeof node, { type: "element" }> => node.type === "element"
    )

    expect(values).toHaveLength(3)
    expect(values?.[0]?.id).not.toBe(values?.[2]?.id)
    expect(values?.[0]?.path).not.toBe(values?.[2]?.path)
    expect(values?.[0]?.span).not.toEqual(values?.[2]?.span)
    expect(values?.[0]?.structuralHash).toBe(values?.[2]?.structuralHash)
    expect(values?.[0]?.structuralHash).not.toBe(values?.[1]?.structuralHash)

    const addressed = parseXmlDocumentWithSaxes(
      '<Root a="1">x<?p alpha?></Root><Root a="1"><![CDATA[x]]><?p alpha?></Root>'
    ).roots
    expect(addressed[0]?.id).not.toBe(addressed[1]?.id)
    expect(addressed[0]?.path).not.toBe(addressed[1]?.path)
    expect(addressed[0]?.span).not.toEqual(addressed[1]?.span)
    expect(addressed[0]?.attributes[0]?.id).not.toBe(addressed[1]?.attributes[0]?.id)
    expect(addressed[0]?.content[0]?.id).not.toBe(addressed[1]?.content[0]?.id)
    expect(addressed[0]?.content[1]?.id).not.toBe(addressed[1]?.content[1]?.id)
    expect(addressed[0]?.structuralHash).toBe(addressed[1]?.structuralHash)
  })

  it("учитывает полный нормализованный PI body", () => {
    const alpha = parseXmlDocumentWithSaxes("<Root><?p alpha?></Root>").roots[0]
    const beta = parseXmlDocumentWithSaxes("<Root><?p beta?></Root>").roots[0]
    const normalized = parseXmlDocumentWithSaxes("<Root><?p   alpha\r\nbeta ?></Root>")
      .roots[0]

    expect(alpha?.content[0]).toMatchObject({
      type: "processingInstruction",
      target: "p",
      body: "alpha",
    })
    expect(beta?.content[0]).toMatchObject({
      type: "processingInstruction",
      target: "p",
      body: "beta",
    })
    expect(normalized?.content[0]).toMatchObject({
      type: "processingInstruction",
      target: "p",
      body: "alpha\nbeta ",
    })
    expect(alpha?.structuralHash).not.toBe(beta?.structuralHash)
  })
})
