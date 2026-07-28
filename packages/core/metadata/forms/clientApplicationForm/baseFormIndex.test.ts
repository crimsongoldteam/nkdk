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
    expect(projected.xmlNode(elementAddress)).toEqual(base.xmlNode(elementAddress))
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

  it("projects a base implicit property-state in the effective form order", () => {
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
        effectivePropertyOrder: [
          "title",
          "formWindowOpeningMode",
          "commands",
          "attributes",
        ],
      }],
    })

    expect(projected.xmlNode(formBodyAddress)).toEqual({
      logicalAddress: formBodyAddress,
      order: ["title", "formWindowOpeningMode", "attributes"],
      present: ["formWindowOpeningMode", "attributes"],
    })
  })

  it("projects shared nested presence into the property context", () => {
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

    expect(projected.xmlNode(propertyAddress)).toEqual({
      logicalAddress: propertyAddress,
      present: ["autoCommandBar"],
    })
  })

  it("keeps selected order-only state without treating it as present", () => {
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
      order: ["dataPath"],
    })
  })

  it("preserves the relative order shared by both snapshots", () => {
    const projected = projectedRootOrder({
      baseOrder: ["title", "commands", "attributes"],
      extensionOrder: ["title", "commands", "attributes"],
      fallbackOrder: ["attributes", "commands", "title"],
    })

    expect(projected).toEqual(["title", "commands", "attributes"])
  })

  it("inserts cfe properties between available base anchors", () => {
    const projected = projectedRootOrder({
      baseOrder: ["title", "attributes"],
      extensionOrder: ["title", "commands", "attributes"],
      fallbackOrder: ["attributes", "title", "commands"],
    })

    expect(projected).toEqual(["title", "commands", "attributes"])
  })

  it("resolves cyclic snapshot constraints in deterministic fallback order", () => {
    const params = {
      baseOrder: ["title", "commands"],
      extensionOrder: ["commands", "title"],
      fallbackOrder: ["commands", "title", "attributes"],
    }

    expect(projectedRootOrder(params)).toEqual([
      "commands",
      "title",
      "attributes",
    ])
    expect(projectedRootOrder(params)).toEqual(projectedRootOrder(params))
  })
})

function projectedRootOrder(params: {
  readonly baseOrder: readonly string[]
  readonly extensionOrder: readonly string[]
  readonly fallbackOrder: readonly string[]
}): readonly string[] | undefined {
  const base = reader({
    componentPath: "cf",
    xmlNodes: [{
      logicalAddress: formBodyAddress,
      order: params.baseOrder,
    }],
  })
  const extension = reader({
    componentPath: "cfe/Дополнение",
    xmlNodes: [{
      logicalAddress: formBodyAddress,
      order: params.extensionOrder,
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
      selectedPropertyKeys: new Set([
        "title",
        "commands",
        "attributes",
      ]),
      effectivePropertyOrder: params.fallbackOrder,
    }],
  })
  return projected.xmlNode(formBodyAddress)?.order
}

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
