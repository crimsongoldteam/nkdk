import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import {
  childUid,
  yamlPropertyUid,
} from "../../configurationIndex/logicalAddress"
import { ClientApplicationFormRules } from "./rules"
import { InputFieldRules } from "../elements/inputField/rules"
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
const formBodyAddress = childUid(formAddress, "ЧастьФормы", "Содержимое")

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
    expect(projected.xmlNode(elementAddress)).toEqual({
      logicalAddress: elementAddress,
    })
    expect(projected.xmlValue(elementPropertyAddress)).toEqual(
      base.xmlValue(elementPropertyAddress)
    )
    expect(projected.snapshot).toBe(base.snapshot)
    expect(projected.binding()).toEqual(base.binding())
    expect(projected.projectFiles()).toEqual(base.projectFiles())
  })

  it("does not infer identity requirements from logical address segments", () => {
    const base = reader({ componentPath: "cf" })
    const extension = reader({ componentPath: "cfe/Дополнение" })
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set([attributeAddress]),
    })

    expect(projected.identity(elementAddress, "xmlId")).toBeUndefined()
    expect(projected.identity(attributeAddress, "xmlId")).toBeUndefined()
  })

  it("returns no xmlId for an optional form property presence check", () => {
    const base = reader({ componentPath: "cf" })
    const extension = reader({ componentPath: "cfe/Дополнение" })
    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set(),
    })
    const optionalPropertyAddress = yamlPropertyUid(
      formAddress,
      "УсловноеОформлениеРеквизитов"
    )

    expect(
      projected.identity(optionalPropertyAddress, "xmlId")
    ).toBeUndefined()
    expect(
      projected.identity(
        childUid(
          attributeAddress,
          "Свойство",
          "ДинамическийСписок"
        ),
        "xmlId"
      )
    ).toBeUndefined()
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

  it("projects a base implicit property-state in xmlOrder", () => {
    const implicitPropertyAddress = childUid(
      formAddress,
      "Свойство",
      "РежимОткрытияОкнаФормы"
    )
    const base = reader({
      componentPath: "cf",
      xmlNodes: [
        {
          logicalAddress: formBodyAddress,
          order: ["commands", "attributes"],
          present: ["commands", "attributes"],
        },
        {
          logicalAddress: implicitPropertyAddress,
          present: ["formWindowOpeningMode"],
        },
      ],
    })
    const extension = reader({
      componentPath: "cfe/Дополнение",
      xmlNodes: [{
        logicalAddress: formBodyAddress,
        order: ["attributes"],
        present: ["attributes"],
      }],
    })

    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set(),
      nodeProjections: [{
        logicalAddress: formAddress,
        xmlNodeLogicalAddress: formBodyAddress,
        rule: ClientApplicationFormRules,
        selectedPropertyKeys: new Set(["title"]),
      }],
    })

    expect(projected.xmlNode(formBodyAddress)).toEqual({
      logicalAddress: formBodyAddress,
      present: ["formWindowOpeningMode", "attributes"],
    })
  })

  it("does not project nested presence from order-only extension state", () => {
    const propertyAddress = childUid(
      formAddress,
      "Свойство",
      "КоманднаяПанель"
    )
    const base = reader({
      componentPath: "cf",
      xmlNodes: [{
        logicalAddress: formBodyAddress,
        present: ["autoCommandBar"],
      }],
    })
    const extension = reader({
      componentPath: "cfe/Дополнение",
      xmlNodes: [{
        logicalAddress: formBodyAddress,
        order: ["autoCommandBar"],
      }],
    })

    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set(),
      nodeProjections: [{
        logicalAddress: formAddress,
        xmlNodeLogicalAddress: formBodyAddress,
        rule: ClientApplicationFormRules,
        selectedPropertyKeys: new Set(),
      }],
    })

    expect(projected.xmlNode(propertyAddress)).toBeUndefined()
  })

  it("ignores selected order-only state", () => {
    const base = reader({
      componentPath: "cf",
      xmlNodes: [{
        logicalAddress: elementAddress,
        order: ["dataPath"],
      }],
    })
    const extension = reader({
      componentPath: "cfe/Дополнение",
      xmlNodes: [{
        logicalAddress: elementAddress,
        order: ["dataPath"],
      }],
    })

    const projected = createBaseFormConfigurationIndexReader({
      base,
      extension,
      extensionIdentityAddresses: new Set(),
      nodeProjections: [{
        logicalAddress: elementAddress,
        xmlNodeLogicalAddress: elementAddress,
        rule: InputFieldRules,
        selectedPropertyKeys: new Set(["dataPath"]),
      }],
    })

    expect(projected.xmlNode(elementAddress)).toEqual({
      logicalAddress: elementAddress,
    })
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
