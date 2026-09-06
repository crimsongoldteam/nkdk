import fs from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { ComponentAddress, XmlElementNode } from "@nkdk/runtime"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import {
  registerXmlImportComponentDescriptor,
  resolveXmlImportComponent,
  type XmlImportComponentDescriptor,
} from "./componentDescriptor"

function descriptor(params: {
  kind: string
  detect(root: XmlElementNode): boolean
  address?: ComponentAddress
}): XmlImportComponentDescriptor {
  return {
    kind: params.kind,
    detect: params.detect,
    resolveRoot: () => ({
      address: params.address ?? { kind: "configuration" },
      itemName: "ТестовыйКорень",
    }),
  }
}

describe("XML import component descriptors", () => {
  it("returns the only descriptor that recognizes the XML root", () => {
    const registered = descriptor({ kind: "test-single", detect: (root) => root.name === "testSingle" })
    registerXmlImportComponentDescriptor(registered)

    expect(resolveXmlImportComponent(parseRoot("<testSingle/>"))).toBe(registered)
  })

  it("rejects XML roots that no descriptor recognizes", () => {
    expect(() => resolveXmlImportComponent(parseRoot("<unknownComponent/>"))).toThrow(/не найдено/iu)
  })

  it("rejects XML roots recognized by multiple descriptors", () => {
    registerXmlImportComponentDescriptor(descriptor({ kind: "test-first", detect: (root) => root.name === "testBoth" }))
    registerXmlImportComponentDescriptor(descriptor({ kind: "test-second", detect: (root) => root.name === "testBoth" }))

    expect(() => resolveXmlImportComponent(parseRoot("<testBoth/>"))).toThrow(/несколько/iu)
  })

  it("rejects a repeated component kind", () => {
    registerXmlImportComponentDescriptor(descriptor({ kind: "test-duplicate", detect: () => false }))

    expect(() =>
      registerXmlImportComponentDescriptor(descriptor({ kind: "test-duplicate", detect: () => false }))
    ).toThrow(/уже зарегистрирован/u)
  })

  it("recognizes a base configuration without ConfigurationExtensionPurpose", () => {
    const root = parseRoot(
      fs.readFileSync(join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/minimal.xml"), "utf-8")
    )
    const component = resolveXmlImportComponent(root)

    expect(component.kind).toBe("configuration")
    expect(component.resolveRoot(root)).toEqual({
      address: { kind: "configuration" },
      itemName: "Конфигурация",
    })
    expect(component.baseAddress).toBeUndefined()
    expect(component.metadataItemAugmenter).toBeUndefined()
  })

  it("rejects an empty root name", () => {
    const root = parseRoot("<MetaDataObject><Configuration><Properties><Name/></Properties></Configuration></MetaDataObject>")
    const component = resolveXmlImportComponent(root)

    expect(() => component.resolveRoot(root)).toThrow(/имя/iu)
  })

  it("распознаёт расширение по присутствию пустого признака без compatibility", () => {
    const root = parseRoot("<MetaDataObject><Configuration><Properties><Name>Расширение</Name><ConfigurationExtensionPurpose/></Properties></Configuration></MetaDataObject>")
    const component = resolveXmlImportComponent(root)
    expect(component.kind).toBe("configurationExtension")
    expect(component.resolveRoot(root)).toEqual({
      address: { kind: "configurationExtension", name: "Расширение" }, itemName: "Расширение",
    })
  })
})

function parseRoot(xml: string): XmlElementNode {
  const root = parseXmlDocumentWithSaxes(xml).roots[0]!
  const discardCompatibility = (node: XmlElementNode): void => {
    Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Нельзя читать compatibility") } })
    for (const child of node.content) if (child.type === "element") discardCompatibility(child)
  }
  discardCompatibility(root)
  return root
}
