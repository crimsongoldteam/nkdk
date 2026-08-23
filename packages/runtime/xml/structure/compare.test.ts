import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import type { XmlElementNode } from "../import/document"
import { compareXmlStructures } from "./compare"

const roots = (xml: string): readonly XmlElementNode[] =>
  parseXmlDocumentWithSaxes(xml, { preserveXsiNil: true }).roots

describe("compareXmlStructures", () => {
  it("uses the structural hash as a fast equality check", () => {
    const original = roots("<Root><Value>one</Value></Root>")[0]!
    const sameHashWithUnavailableSubtree = {
      ...original,
      name: "This subtree must not be inspected",
      content: [],
    }

    expect(compareXmlStructures([original], [sameHashWithUnavailableSubtree])).toEqual([])
  })

  it("returns only the deepest independently mismatching paths", () => {
    const expected = roots(
      '<Root mode="old"><Group><Value>one</Value></Group><Stable>same</Stable></Root>'
    )
    const actual = roots(
      '<Root mode="new"><Group><Value>two</Value></Group><Stable>same</Stable><Extra/></Root>'
    )

    expect(compareXmlStructures(expected, actual)).toEqual([
      "/Root[1]/@mode[1]",
      "/Root[1]/Group[1]/Value[1]/#text[1]",
      "/Root[1]/Extra[1]",
    ])
  })

  it.each([
    [
      '<Root first="1" second="2"/>',
      '<Root second="2" first="1"/>',
      "/Root[1]/#attributes/#order",
    ],
    ["<Root><A/><B/></Root>", "<Root><B/><A/></Root>", "/Root[1]/#order"],
  ])("reports an explicit order boundary for %s", (expected, actual, path) => {
    expect(compareXmlStructures(roots(expected), roots(actual))).toEqual([path])
  })
})
