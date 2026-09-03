import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { createLocalXmlProof } from "../xmlAnomaly/localProof"
import { createLocalXmlBodyConsumer } from "./localXmlBodyConsumer"

type WriteEvent = Parameters<ReturnType<typeof createLocalXmlBodyConsumer>["write"]>[0]

describe("createLocalXmlBodyConsumer", () => {
  it("передаёт родителю структурный XML, уже сохранённый предметным индексом", () => {
    const root = parseXmlDocumentWithSaxes("<Root><ChildObjects><Catalog>A</Catalog></ChildObjects></Root>").roots[0]!
    const childObjects = root.content[0]!
    if (childObjects.type !== "element") throw new Error("ChildObjects")
    const proof = createLocalXmlProof()
    const consumer = createLocalXmlBodyConsumer({
      key: "owner",
      source: root,
      proof,
      childReceipt: () => undefined,
      scalarReceipt: () => undefined,
    })
    consumer.bind?.({
      propertyKey: "childObjects",
      node: childObjects,
      presentInXML: true,
      xmlPath: ["ChildObjects"],
      structurallyClaimed: true,
    })

    expect(consumer.finish({
      outputs: new Map([["owner", {}]]),
      deferredByOutput: new Map(),
      externalWrites: [],
    })).toEqual(new Map([["owner", expect.objectContaining({ name: "Root" })]]))
  })

  it("проверяет общий XML-контейнер нескольких свойств один раз", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Settings/></Root>").roots[0]!
    const settings = root.content.find(
      (node): node is Extract<typeof node, { type: "element" }> =>
        node.type === "element" && node.name === "Settings",
    )!
    const consumer = createLocalXmlBodyConsumer({
      key: "owner",
      source: root,
      proof: createLocalXmlProof(),
      childReceipt: () => undefined,
      scalarReceipt: () => undefined,
    })
    const property = (propertyKey: string): WriteEvent["property"] => asWriteProperty({
      propertyKey,
      yamlKey: propertyKey,
      xmlPath: ["Settings"],
      propertyRule: { type: "string", xml: "Settings", yaml: propertyKey },
      operations: {},
    })
    const first = property("type")
    const second = property("settings")

    consumer.bind?.({ propertyKey: first.propertyKey, node: settings, presentInXML: true })
    consumer.bind?.({ propertyKey: second.propertyKey, node: settings, presentInXML: true })
    consumer.write({ outputKey: "owner", property: first, path: ["Settings"], value: {} })
    consumer.write({ outputKey: "owner", property: second, path: ["Settings"], value: {} })

    expect(consumer.finish({
      outputs: new Map([["owner", { Settings: {} }]]),
      deferredByOutput: new Map(),
      externalWrites: [],
    })).toEqual(new Map([["owner", expect.objectContaining({ name: "Root" })]]))
  })
})

function asWriteProperty(value: object): WriteEvent["property"] {
  return value as WriteEvent["property"]
}
