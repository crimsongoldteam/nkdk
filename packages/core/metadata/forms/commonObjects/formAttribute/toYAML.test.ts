import { beforeEach, describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  choiceListFormAttribute,
  choiceListFormAttributeYAML,
  fullFormAttributes,
  fullFormAttributesYAML,
  mixedColumnsFormAttribute,
  mixedColumnsFormAttributeYAML,
  shortFormAttribute,
  shortFormAttributeYAML,
  tableWithColumnsFormAttribute,
  tableWithColumnsFormAttributeYAML,
  treeWithColumnFormAttribute,
  treeWithColumnFormAttributeYAML,
  withAdditionalColumnFormAttribute,
  withAdditionalColumnFormAttributeYAML,
  withEmptySettingsFormAttribute,
  withEmptySettingsFormAttributeYAML,
  withFunctionalOptionsFormAttribute,
  withFunctionalOptionsFormAttributeYAML,
} from "~/tests/fixtures/formAttributes/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFormAttributesToYAML } from "./toYAML"

let context: ConfigurationContext

describe("exportFormAttributesToYAML", () => {
  beforeEach(() => {
    context = {
      ...mockContext,
      exportToYAML: {
        toTyped: false,
      },
    }
  })
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToYAML(context, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFormAttributesToYAML(context, mockRule, fullFormAttributes)

    expect(result).toEqual(fullFormAttributesYAML)
  })

  it("should export with short format", () => {
    const result = exportFormAttributesToYAML(context, mockRule, shortFormAttribute)

    expect(result).toEqual(shortFormAttributeYAML)
  })

  // it("should export title when mainAttribute=true and title equals name", () => {
  //   const result = exportFormAttributesToYAML(context, mockRule, mainAttributeTitleEqualsName)

  //   expect(result).toEqual(mainAttributeTitleEqualsNameYAML)
  // })

  it("should export choice list", () => {
    const result = exportFormAttributesToYAML(context, mockRule, choiceListFormAttribute)

    expect(result).toEqual(choiceListFormAttributeYAML)
  })

  it("should export with empty settings", () => {
    const result = exportFormAttributesToYAML(context, mockRule, withEmptySettingsFormAttribute)

    expect(result).toEqual(withEmptySettingsFormAttributeYAML)
  })

  // it("should export with dynamic list", () => {
  //   const result = exportFormAttributesToYAML(context, mockRule, withDynamicListFormAttribute)

  //   expect(result).toEqual(withDynamicListFormAttributeYAML)
  // })

  it("should export table with columns", () => {
    const result = exportFormAttributesToYAML(context, mockRule, tableWithColumnsFormAttribute)

    expect(result).toEqual(tableWithColumnsFormAttributeYAML)
  })

  it("should export tree with column", () => {
    const result = exportFormAttributesToYAML(context, mockRule, treeWithColumnFormAttribute)

    expect(result).toEqual(treeWithColumnFormAttributeYAML)
  })

  it("should export with functional options", () => {
    const result = exportFormAttributesToYAML(context, mockRule, withFunctionalOptionsFormAttribute)

    expect(result).toEqual(withFunctionalOptionsFormAttributeYAML)
  })

  it("should export with additional column", () => {
    const result = exportFormAttributesToYAML(context, mockRule, withAdditionalColumnFormAttribute)

    expect(result).toEqual(withAdditionalColumnFormAttributeYAML)
  })

  it("should export mixed columns", () => {
    const result = exportFormAttributesToYAML(context, mockRule, mixedColumnsFormAttribute)

    expect(result).toEqual(mixedColumnsFormAttributeYAML)
  })
})
