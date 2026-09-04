import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { createLocalXmlProof } from "../xmlAnomaly/localProof"
import { createXmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { createAnnotatedLocalXmlBodyConsumers } from "./annotatedLocalXmlBodyConsumer"
import { createLocalXmlBodyConsumer } from "./localXmlBodyConsumer"

type WriteEvent = Parameters<ReturnType<typeof createLocalXmlBodyConsumer>["write"]>[0]

describe("createLocalXmlBodyConsumer", () => {
  it("маршрутизирует структурную привязку только в содержащий её XML-выход", () => {
    const body = parseXmlDocumentWithSaxes("<Form/>").roots[0]!
    const metadata = parseXmlDocumentWithSaxes(
      "<MetaDataObject><Form><Properties><Comment/></Properties></Form></MetaDataObject>",
    ).roots[0]!
    const metadataForm = metadata.content[0]!
    if (metadataForm.type !== "element") throw new Error("Form")
    const properties = metadataForm.content[0]!
    if (properties.type !== "element") throw new Error("Properties")
    const comment = properties.content[0]!
    if (comment.type !== "element") throw new Error("Comment")
    const annotations = createXmlAnomalyAnnotations()
    const consumer = createAnnotatedLocalXmlBodyConsumers({
      sources: [
        { key: "body", source: body, proof: createLocalXmlProof() },
        { key: "metadata", source: metadata, proof: createLocalXmlProof() },
      ],
      yaml: {}, annotations,
      childReceipt: () => undefined, scalarReceipt: () => undefined,
    })
    consumer.bind?.({
      propertyKey: "comment", node: comment, presentInXML: true,
      xmlPath: ["Form", "Properties", "Comment"], structurallyClaimed: true,
    })

    expect(consumer.finish({
      outputs: new Map([["body", {}], ["metadata", {}]]),
      deferredByOutput: new Map(), externalWrites: [],
    })).toEqual(new Map([
      ["body", expect.objectContaining({ name: "Form" })],
      ["metadata", expect.objectContaining({ name: "MetaDataObject" })],
    ]))
    expect(annotations.entries()).toEqual([])
  })

  it("передаёт родителю структурный XML, уже сохранённый предметным индексом", () => {
    const root = parseXmlDocumentWithSaxes("<Root><ChildObjects><Catalog>A</Catalog></ChildObjects></Root>").roots[0]!
    const childObjects = root.content[0]!
    if (childObjects.type !== "element") throw new Error("ChildObjects")
    const proof = createLocalXmlProof()
    const consumer = bodyConsumer(root, { proof })
    consumer.bind?.({
      propertyKey: "childObjects",
      node: childObjects,
      presentInXML: true,
      xmlPath: ["ChildObjects"],
      structurallyClaimed: true,
    })

    expectOwnerFinished(consumer)
  })

  it("переиспользует структурный XML, уже подтверждённый соседней границей", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Properties><Comment/></Properties></Root>").roots[0]!
    const properties = root.content[0]!
    if (properties.type !== "element") throw new Error("Properties")
    const comment = properties.content[0]!
    if (comment.type !== "element") throw new Error("Comment")
    const proof = createLocalXmlProof()
    proof.accept(comment)
    const consumer = bodyConsumer(root, { proof })
    consumer.bind?.({
      propertyKey: "comment", node: comment, presentInXML: true,
      xmlPath: ["Properties", "Comment"], structurallyClaimed: true,
    })

    expectOwnerFinished(consumer)
  })

  it("не проверяет повторно обычное свойство, уже подтверждённое соседней границей", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Value>same</Value></Root>").roots[0]!
    const value = root.content[0]!
    if (value.type !== "element") throw new Error("Value")
    const proof = createLocalXmlProof()
    proof.accept(value)
    const consumer = bodyConsumer(root, { proof })
    const property = asWriteProperty({
      propertyKey: "value", yamlKey: "value", xmlPath: ["Value"],
      propertyRule: { type: "string", xml: "Value", yaml: "value" }, operations: {},
    })
    consumer.bind?.({ propertyKey: "value", node: value, presentInXML: true, xmlPath: ["Value"] })
    consumer.write({ outputKey: "owner", property, path: ["Value"], value: "same" })

    expectOwnerFinished(consumer, { Value: "same" })
  })

  it("передаёт все повторяющиеся структурные XML-узлы из предметного индекса", () => {
    const { root, nodes } = repeatedScalarItems()
    const proof = createLocalXmlProof()
    const consumer = bodyConsumer(root, { proof })
    consumer.bind?.({
      propertyKey: "items", node: nodes[0], nodes, presentInXML: true,
      xmlPath: ["Items", "Item"], structurallyClaimed: true,
    })

    expectOwnerFinished(consumer, { Items: { Item: ["A", "B"] } })
    expect(nodes.map(node => proof.completed(node))).toEqual(nodes.map(node => expect.objectContaining({ sourceId: node.id })))
  })

  it("проверяет общий XML-контейнер нескольких свойств один раз", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Settings/></Root>").roots[0]!
    const settings = root.content.find(
      (node): node is Extract<typeof node, { type: "element" }> =>
        node.type === "element" && node.name === "Settings",
    )!
    const consumer = bodyConsumer(root)
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

    expectOwnerFinished(consumer, { Settings: {} })
  })

  it("сохраняет вклады всех уже проверенных элементов коллекции", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Items><Item/><Item/></Items></Root>").roots[0]!
    const items = root.content[0]!
    if (items.type !== "element") throw new Error("Items")
    const children = items.content.filter((node) => node.type === "element")
    const proof = createLocalXmlProof()
    const first = {}
    const second = {}
    const receipts = new WeakMap<object, ReturnType<typeof proof.accept>>([
      [first, proof.accept(children[0]!)],
      [second, proof.accept(children[1]!)],
    ])
    const differences: unknown[] = []
    const consumer = bodyConsumer(root, {
      proof,
      childReceipt: (value) => value !== null && typeof value === "object" ? receipts.get(value) : undefined,
      annotate: ({ differences: found }) => differences.push(...found),
    })
    const property = asWriteProperty({
      propertyKey: "items",
      yamlKey: "items",
      xmlPath: ["Items", "Item"],
      propertyRule: { type: "collection", xml: "Item", yaml: "items" },
      operations: {},
    })
    consumer.bind?.({
      propertyKey: property.propertyKey,
      node: children[0],
      presentInXML: true,
      xmlPath: ["Items", "Item"],
    })
    consumer.write({ outputKey: "owner", property, path: ["Items", "Item"], value: [first, second] })

    expectOwnerFinished(consumer, { Items: { Item: [first, second] } })
    expect(differences).toEqual([])
  })

  it("проверяет все повторяющиеся скалярные XML-узлы одного свойства", () => {
    const { root, nodes } = repeatedScalarItems()
    const differences: unknown[] = []
    const consumer = bodyConsumer(root, {
      annotate: ({ differences: found }) => differences.push(...found),
    })
    const property = asWriteProperty({
      propertyKey: "items", yamlKey: "items", xmlPath: ["Items", "Item"],
      propertyRule: { type: "strings", xml: "Item", yaml: "items" }, operations: {},
    })
    consumer.bind?.({
      propertyKey: property.propertyKey, node: nodes[0], nodes,
      presentInXML: true, xmlPath: ["Items", "Item"],
    })
    consumer.write({ outputKey: "owner", property, path: ["Items", "Item"], value: ["A", "B"] })

    expectOwnerFinished(consumer, { Items: { Item: ["A", "B"] } })
    expect(differences).toEqual([])
  })
})

function asWriteProperty(value: object): WriteEvent["property"] {
  return value as WriteEvent["property"]
}

function repeatedScalarItems() {
  const root = parseXmlDocumentWithSaxes("<Root><Items><Item>A</Item><Item>B</Item></Items></Root>").roots[0]!
  const items = root.content[0]!
  if (items.type !== "element") throw new Error("Items")
  return { root, nodes: items.content.filter((node) => node.type === "element") }
}

type BodyConsumer = ReturnType<typeof createLocalXmlBodyConsumer>
type BodyConsumerParams = Parameters<typeof createLocalXmlBodyConsumer>[0]

function bodyConsumer(
  source: BodyConsumerParams["source"],
  overrides: Partial<Omit<BodyConsumerParams, "key" | "source">> = {},
): BodyConsumer {
  return createLocalXmlBodyConsumer({
    key: "owner",
    source,
    proof: createLocalXmlProof(),
    childReceipt: () => undefined,
    scalarReceipt: () => undefined,
    ...overrides,
  })
}

function expectOwnerFinished(consumer: BodyConsumer, output: Record<string, unknown> = {}): void {
  expect(consumer.finish({
    outputs: new Map([["owner", output]]),
    deferredByOutput: new Map(),
    externalWrites: [],
  })).toEqual(new Map([["owner", expect.objectContaining({ name: "Root" })]]))
}
