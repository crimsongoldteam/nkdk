import {
  createLocalConfigurationIndexReader,
  type ConfigurationIndexBlockEntity,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import {
  buildXmlComponentReconstructionProfile,
  type XmlReconstructionProfileIndex,
} from "./xmlReconstructionProfile"

const BASE_CONFIGURATION_UUID = "11111111-1111-4111-8111-111111111111"
const EXTENSION_CONFIGURATION_UUID = "22222222-2222-4222-8222-222222222222"
const BASE_ATTRIBUTE_UUID = "33333333-3333-4333-8333-333333333333"
const EXTENSION_ATTRIBUTE_UUID = "44444444-4444-4444-8444-444444444444"

describe("buildXmlComponentReconstructionProfile", () => {
  it("materializes indexed and full variants for every configuration address", () => {
    const profile = buildXmlComponentReconstructionProfile({
      componentKind: "configuration",
      target: source(
        [
          "ПланВидовХарактеристик.ВидыСвойств",
          "ПланВидовХарактеристик.ВидыСвойств.Характеристики[0].ПолеПутиКДанным",
          "Справочник.Товары",
        ],
        [{
          logicalAddress: "ПланВидовХарактеристик.ВидыСвойств",
          uuid: "55555555-5555-4555-8555-555555555555",
        }],
      ),
    })

    expect(profile).toEqual({
      componentKind: "configuration",
      adoptedUuids: {},
      xmlDefaultVariantByLogicalAddress: {
        "ПланВидовХарактеристик.ВидыСвойств": "indexed",
        "ПланВидовХарактеристик.ВидыСвойств.Характеристики[0].ПолеПутиКДанным": "indexed",
        "Справочник.Товары": "full",
      },
    })
    expect(Object.isFrozen(profile)).toBe(true)
    expect(Object.isFrozen(profile.adoptedUuids)).toBe(true)
    expect(Object.isFrozen(profile.xmlDefaultVariantByLogicalAddress)).toBe(true)
  })

  it("assigns exact adopted and full variants in an extension", () => {
    const borrowed = "Catalog.Товары.Attribute.Артикул"
    const own = "Catalog.Товары.Attribute.Собственный"
    const profile = buildXmlComponentReconstructionProfile({
      componentKind: "configurationExtension",
      target: source(
        ["Конфигурация", "Catalog.Товары", borrowed, own],
        [
          { logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID },
          { logicalAddress: borrowed, uuid: EXTENSION_ATTRIBUTE_UUID },
        ],
      ),
      base: source(
        ["Конфигурация", "Catalog.Товары", borrowed],
        [
          { logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID },
          { logicalAddress: borrowed, uuid: BASE_ATTRIBUTE_UUID },
        ],
      ),
    })

    expect(profile).toEqual({
      componentKind: "configurationExtension",
      adoptedUuids: {
        Конфигурация: BASE_CONFIGURATION_UUID,
        "Справочник.Товары.Реквизит.Артикул": BASE_ATTRIBUTE_UUID,
      },
      xmlDefaultVariantByLogicalAddress: {
        Конфигурация: "adopted",
        "Справочник.Товары": "adopted",
        "Справочник.Товары.Реквизит.Артикул": "adopted",
        "Справочник.Товары.Реквизит.Собственный": "full",
      },
    })
  })

  it("rejects a borrowed UUID-bearing object without a base UUID", () => {
    expect(() => buildXmlComponentReconstructionProfile({
      componentKind: "configurationExtension",
      target: source(
        ["Конфигурация", "Catalog.Товары"],
        [
          { logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID },
          { logicalAddress: "Catalog.Товары", uuid: EXTENSION_ATTRIBUTE_UUID },
        ],
      ),
      base: source(
        ["Конфигурация", "Catalog.Товары"],
        [{ logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID }],
      ),
    })).toThrow("Не найден UUID основной конфигурации: Справочник.Товары")
  })

  it("allows an addressable form element that has no UUID entity", () => {
    const element = "Catalog.Товары.Form.Форма.Element.Группа"
    const profile = buildXmlComponentReconstructionProfile({
      componentKind: "configurationExtension",
      target: source(
        ["Конфигурация", element],
        [{ logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID }],
      ),
      base: source(
        ["Конфигурация", element],
        [{ logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID }],
      ),
    })

    expect(profile.xmlDefaultVariantByLogicalAddress).toEqual({
      Конфигурация: "adopted",
      [element]: "adopted",
    })
    expect(profile.adoptedUuids).toEqual({ Конфигурация: BASE_CONFIGURATION_UUID })
  })

  it("rejects conflicting UUIDs after address canonicalization", () => {
    expect(() => buildXmlComponentReconstructionProfile({
      componentKind: "configurationExtension",
      target: source(
        ["Конфигурация", "Catalog.Товары", "Справочник.Товары"],
        [
          { logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID },
          { logicalAddress: "Catalog.Товары", uuid: EXTENSION_ATTRIBUTE_UUID },
        ],
      ),
      base: source(
        ["Конфигурация", "Catalog.Товары", "Справочник.Товары"],
        [
          { logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID },
          { logicalAddress: "Catalog.Товары", uuid: BASE_ATTRIBUTE_UUID },
          { logicalAddress: "Справочник.Товары", uuid: "66666666-6666-4666-8666-666666666666" },
        ],
      ),
    })).toThrow("Противоречивые UUID: Справочник.Товары")
  })
})

function source(
  logicalAddresses: readonly string[],
  entities: readonly ConfigurationIndexBlockEntity[],
): XmlReconstructionProfileIndex {
  return {
    logicalAddresses,
    index: createLocalConfigurationIndexReader(new Map([
      ["Свойства.yaml", { entities }],
    ])),
  }
}
