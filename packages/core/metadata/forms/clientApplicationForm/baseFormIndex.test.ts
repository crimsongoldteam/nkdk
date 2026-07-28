import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import {
  childUid,
  yamlPropertyUid,
} from "../../configurationIndex/logicalAddress"
import {
  createConfigurationIndexReader,
  snapshotConfigurationIndex,
  type ConfigurationIndexReader,
} from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type {
  ConfigurationIdentity,
  ConfigurationIndexData,
} from "../../configurationIndex/types"
import { createBaseFormConfigurationIndexReader } from "./baseFormIndex"

const formAddress = "Справочник.Товары.Форма.ФормаЭлемента"
const elementAddress = childUid(formAddress, "Элемент", "Код")
const attributeAddress = childUid(formAddress, "Атрибут", "Объект")
const commandAddress = childUid(formAddress, "Команда", "Обновить")
const parameterAddress = childUid(formAddress, "Параметр", "Отбор")
const elementPropertyAddress = yamlPropertyUid(elementAddress, "title")

describe("BaseForm configuration index reader", () => {
  it("reads local explicit component identities from cfe and all other form state from cf", () => {
    const base = reader({
      componentPath: "cf",
      identities: [
        xmlId(elementAddress, "4"),
        xmlId(attributeAddress, "4"),
        xmlId(commandAddress, "5"),
        xmlId(parameterAddress, "6"),
      ],
      xmlNodes: [{
        logicalAddress: elementAddress,
        order: ["name", "title"],
        aliases: { title: "Title" },
      }],
      xmlValues: [{
        logicalAddress: elementPropertyAddress,
        explicitEmpty: true,
      }],
    })
    const extension = reader({
      componentPath: "cfe/Дополнение",
      identities: [
        xmlId(elementAddress, "1000000"),
        xmlId(attributeAddress, "1000001"),
        xmlId(commandAddress, "1000002"),
        xmlId(parameterAddress, "1000003"),
      ],
      xmlNodes: [{
        logicalAddress: elementAddress,
        order: ["title", "name"],
        aliases: { title: "ExtensionTitle" },
      }],
      xmlValues: [{
        logicalAddress: elementPropertyAddress,
        xmlText: "extension",
      }],
    })

    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([
        attributeAddress,
        commandAddress,
        parameterAddress,
      ]),
    })

    expect(projected.identity(elementAddress, "xmlId")).toBe("4")
    expect(projected.identity(attributeAddress, "xmlId")).toBe("1000001")
    expect(projected.identity(commandAddress, "xmlId")).toBe("1000002")
    expect(projected.identity(parameterAddress, "xmlId")).toBe("1000003")
    expect(projected.xmlNode(elementAddress)).toEqual(base.xmlNode(elementAddress))
    expect(projected.xmlValue(elementPropertyAddress)).toEqual(
      base.xmlValue(elementPropertyAddress)
    )
    expect(projected.snapshot).toBe(base.snapshot)
    expect(projected.binding()).toEqual(base.binding())
    expect(projected.projectFiles()).toEqual(base.projectFiles())
  })

  it("reports the logical address when a required xmlId is absent", () => {
    const base = reader({ componentPath: "cf" })
    const extension = reader({ componentPath: "cfe/Дополнение" })
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([attributeAddress]),
    })

    expect(() => projected.identity(elementAddress, "xmlId"))
      .toThrow(elementAddress)
    expect(() => projected.identity(attributeAddress, "xmlId"))
      .toThrow(attributeAddress)
  })

  it("enumerates the same identity projection as point lookups", () => {
    const base = reader({
      componentPath: "cf",
      identities: [
        xmlId(elementAddress, "4"),
        xmlId(attributeAddress, "4"),
      ],
    })
    const extension = reader({
      componentPath: "cfe/Дополнение",
      identities: [
        xmlId(elementAddress, "1000000"),
        xmlId(attributeAddress, "1000001"),
      ],
    })
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([attributeAddress]),
    })

    expect(projected.identities()).toEqual([
      xmlId(elementAddress, "4"),
      xmlId(attributeAddress, "1000001"),
    ])
    expect(projected.xmlNodes()).toEqual(base.xmlNodes())
  })
})

function reader(params: {
  readonly componentPath: string
  readonly identities?: readonly ConfigurationIdentity[]
  readonly xmlNodes?: ConfigurationIndexData["xmlNodes"]
  readonly xmlValues?: ConfigurationIndexData["xmlValues"]
}): ConfigurationIndexReader {
  const sample = sampleIndex()
  return createConfigurationIndexReader(
    snapshotConfigurationIndex(
      encodeConfigurationIndex({
        ...sample,
        binding: {
          ...sample.binding,
          componentPath: params.componentPath,
        },
        identities: params.identities ?? [],
        xmlNodes: params.xmlNodes ?? [],
        xmlValues: params.xmlValues ?? [],
      })
    )
  )
}

function xmlId(
  logicalAddress: string,
  value: string
): ConfigurationIdentity {
  return { logicalAddress, kind: "xmlId", value }
}
