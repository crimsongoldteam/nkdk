import fs from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import type { ComponentAddress } from "../components/address"
import type { MetadataItemRule } from "../orchestration/property/types"
import importContentFromXML from "../../xml/import/importer"
import {
  registerXmlImportComponentDescriptor,
  resolveXmlImportComponent,
  type XmlImportComponentDescriptor,
} from "./componentDescriptor"

const TestRule = { itemType: "TestComponent", properties: {} } as MetadataItemRule

function descriptor(params: {
  kind: string
  detect(root: Record<string, unknown>): boolean
  address?: ComponentAddress
}): XmlImportComponentDescriptor {
  return {
    kind: params.kind,
    rootRule: TestRule,
    detect: params.detect,
    resolveAddress: () => params.address ?? { kind: "configuration" },
  }
}

describe("XML import component descriptors", () => {
  it("returns the only descriptor that recognizes the XML root", () => {
    const registered = descriptor({ kind: "test-single", detect: (root) => root["testSingle"] === true })
    registerXmlImportComponentDescriptor(registered)

    expect(resolveXmlImportComponent({ testSingle: true })).toBe(registered)
  })

  it("rejects XML roots that no descriptor recognizes", () => {
    expect(() => resolveXmlImportComponent({ unknownComponent: true })).toThrow(/не найдено/iu)
  })

  it("rejects XML roots recognized by multiple descriptors", () => {
    registerXmlImportComponentDescriptor(descriptor({ kind: "test-first", detect: (root) => root["testBoth"] === true }))
    registerXmlImportComponentDescriptor(descriptor({ kind: "test-second", detect: (root) => root["testBoth"] === true }))

    expect(() => resolveXmlImportComponent({ testBoth: true })).toThrow(/несколько/iu)
  })

  it("rejects a repeated component kind", () => {
    registerXmlImportComponentDescriptor(descriptor({ kind: "test-duplicate", detect: () => false }))

    expect(() =>
      registerXmlImportComponentDescriptor(descriptor({ kind: "test-duplicate", detect: () => false }))
    ).toThrow(/уже зарегистрирован/u)
  })

  it("recognizes a base configuration without ConfigurationExtensionPurpose", () => {
    const parsed = importContentFromXML<Record<string, unknown>>(
      fs.readFileSync(join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/minimal.xml"), "utf-8")
    )
    const root = parsed["MetaDataObject"] as Record<string, unknown>
    const component = resolveXmlImportComponent(root)

    expect(component.kind).toBe("configuration")
    expect(component.rootRule).toBe(MetadataConfigurationRules)
    expect(component.resolveAddress(root)).toEqual({ kind: "configuration" })
    expect(component.baseAddress).toBeUndefined()
    expect(component.metadataItemAugmenter).toBeUndefined()
  })
})
