import { describe, expect, it } from "vitest"
import { importContentFromXML } from "./importer"

const XML_METADATA = Symbol.for("metadata")

const childOrderOf = (value: unknown): Array<{ key: string; index: number }> | undefined => {
  if (typeof value !== "object" || value === null) return undefined
  const metadata = (value as Record<PropertyKey, unknown>)[XML_METADATA]
  if (typeof metadata !== "object" || metadata === null) return undefined
  return (metadata as { childOrder?: Array<{ key: string; index: number }> }).childOrder
}

describe("importContentFromXML", () => {
  it("preserves numeric-looking text nodes as strings", () => {
    const xml = `<root><Presentation><v8:item><v8:lang>ru</v8:lang><v8:content>2.0</v8:content></v8:item></Presentation></root>`

    const result = importContentFromXML<{
      root: {
        Presentation: {
          "v8:item": {
            "v8:lang": string
            "v8:content": string
          }
        }
      }
    }>(xml)

    expect(result.root.Presentation["v8:item"]["v8:content"]).toBe("2.0")
    expect(typeof result.root.Presentation["v8:item"]["v8:content"]).toBe("string")
  })

  it("drops xsi:nil attributes unless preserveXsiNil is enabled", () => {
    const xml = `<Root><Settings><Value xsi:nil="true"/></Settings><Outside><Value xsi:nil="true"/></Outside></Root>`

    const result = importContentFromXML<{
      Root: {
        Settings: { Value?: { "_xsi:nil": string } }
        Outside: { Value?: { "_xsi:nil": string } }
      }
    }>(xml)

    expect(result.Root.Settings.Value).toBeUndefined()
    expect(result.Root.Outside.Value).toBeUndefined()

    const preserved = importContentFromXML<{
      Root: {
        Settings: { Value: { "_xsi:nil": string } }
        Outside: { Value: { "_xsi:nil": string } }
      }
    }>(xml, { preserveXsiNil: true })

    expect(preserved.Root.Settings.Value).toEqual({ "_xsi:nil": "true" })
    expect(preserved.Root.Outside.Value).toEqual({ "_xsi:nil": "true" })
  })

  it("сохраняет пустые элементы по запросу", () => {
    const xml = "<Root><Empty/><Parent><Child/></Parent></Root>"

    expect(importContentFromXML(xml, { preserveEmptyElements: true })).toEqual({
      Root: { Empty: {}, Parent: { Child: {} } },
    })
  })

  it("сохраняет XML declaration и порядок разноимённых детей", () => {
    const result = importContentFromXML<{
      "?xml": { _version: string; _encoding: string }
      Root: { A: string[]; B: string }
    }>(`<?xml version="1.0" encoding="UTF-8"?><Root><A>1</A><B>2</B><A>3</A></Root>`)

    expect(result).toEqual({
      "?xml": { _version: "1.0", _encoding: "UTF-8" },
      Root: { A: ["1", "3"], B: "2" },
    })
    expect(childOrderOf(result)).toEqual([
      { key: "?xml", index: 0 },
      { key: "Root", index: 0 },
    ])
    expect(childOrderOf(result.Root)).toEqual([
      { key: "A", index: 0 },
      { key: "B", index: 0 },
      { key: "A", index: 1 },
    ])
  })

  it("сохраняет ordered-содержимое ChildItems", () => {
    const result = importContentFromXML<{
      Root: { ChildItems: Array<Record<string, unknown>> }
    }>("<Root><ChildItems><A/><B/><A/></ChildItems></Root>", { preserveEmptyElements: true })

    expect(result.Root.ChildItems).toEqual([{ A: {} }, { B: {} }, { A: {} }])
  })

  it("объединяет text и CDATA без обрезки пробелов", () => {
    expect(importContentFromXML("<Root> A<![CDATA[B]]> C</Root>")).toEqual({ Root: " AB C" })
  })

  it.each([
    ["entity", "<Root>A&amp;B</Root>", { Root: "A&B" }],
    ["comment", "<Root>A<!--ignored-->B</Root>", { Root: "AB" }],
    ["attribute and text", '<Root id="1">x</Root>', { Root: { _id: "1", "#text": "x" } }],
    ["namespace prefixes", '<xr:Root xr:id="1"/>', { "xr:Root": { "_xr:id": "1" } }],
  ])("сохраняет %s", (_case, xml, expected) => {
    expect(importContentFromXML(xml)).toEqual(expected)
  })

  it("преобразует processing instruction в элемент", () => {
    expect(importContentFromXML('<Root><?foo bar="baz"?></Root>', { preserveEmptyElements: true })).toEqual({
      Root: { "?foo": { _bar: "baz" } },
    })
  })

  it("отклоняет имена, небезопасные для объекта", () => {
    expect(() => importContentFromXML("<Root><__proto__>x</__proto__></Root>")).toThrow()
  })

  it("сохраняет BOM перед XML declaration как документный текст", () => {
    expect(importContentFromXML('\uFEFF<?xml version="1.0"?><Root/>')).toEqual({
      "?xml": { _version: "1.0" },
      Root: undefined,
      "#text": "\uFEFF",
    })
  })

  it("разбирает XML-фрагмент с несколькими корнями", () => {
    const result = importContentFromXML<{ Command: Array<{ _id: string }> }>(
      '<Command id="1"/><Command id="2"/>'
    )

    expect(result).toEqual({ Command: [{ _id: "1" }, { _id: "2" }] })
    expect(childOrderOf(result)).toEqual([
      { key: "Command", index: 0 },
      { key: "Command", index: 1 },
    ])
  })

  it("отклоняет некорректный XML", () => {
    expect(() => importContentFromXML("<Root><Child></Root>")).toThrow()
  })
})
