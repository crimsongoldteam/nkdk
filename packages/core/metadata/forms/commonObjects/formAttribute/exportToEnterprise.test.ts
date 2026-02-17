import { beforeEach, describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  choiceListFormAttribute,
  choiceListFormAttributeEnterprise,
  fullFormAttributes,
  fullFormAttributesEnterprise,
  shortFormAttribute,
  shortFormAttributeEnterprise,
  tableWithColumnsFormAttribute,
  tableWithColumnsFormAttributeEnterprise,
  treeWithColumnFormAttribute,
  treeWithColumnFormAttributeEnterprise,
  withAdditionalColumnFormAttribute,
  withAdditionalColumnFormAttributeEnterprise,
  withDynamicListFormAttribute,
  withDynamicListFormAttributeEnterprise,
  withEmptySettingsFormAttribute,
  withEmptySettingsFormAttributeEnterprise,
  withFunctionalOptionsFormAttribute,
  withFunctionalOptionsFormAttributeEnterprise,
} from "~/tests/fixtures/formAttributes/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFormAttributesToEnterprise } from "./exportToEnterprise"

let context: ConfigurationContext

describe("exportFormAttributesToEnterprise", () => {
  beforeEach(() => {
    context = {
      ...mockContext,
      exportToYAML: {
        toTyped: false,
      },
    }
  })
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, fullFormAttributes)

    expect(result).toEqual(fullFormAttributesEnterprise)
  })

  it("should export with short format", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, shortFormAttribute)

    expect(result).toEqual(shortFormAttributeEnterprise)
  })

  // it("should export title when mainAttribute=true and title equals name", () => {
  //   const result = exportFormAttributesToEnterprise(context, mockRule, mainAttributeTitleEqualsName)

  //   expect(result).toEqual(mainAttributeTitleEqualsNameEnterprise)
  // })

  it("should export choice list", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, choiceListFormAttribute)

    expect(result).toEqual(choiceListFormAttributeEnterprise)
  })

  it("should export with empty settings", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, withEmptySettingsFormAttribute)

    expect(result).toEqual(withEmptySettingsFormAttributeEnterprise)
  })

  it("should export with dynamic list", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, withDynamicListFormAttribute)

    expect(result).toEqual(withDynamicListFormAttributeEnterprise)
  })

  it("should export table with columns", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, tableWithColumnsFormAttribute)

    expect(result).toEqual(tableWithColumnsFormAttributeEnterprise)
  })

  it("should export tree with column", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, treeWithColumnFormAttribute)

    expect(result).toEqual(treeWithColumnFormAttributeEnterprise)
  })

  it("should export with functional options", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, withFunctionalOptionsFormAttribute)

    expect(result).toEqual(withFunctionalOptionsFormAttributeEnterprise)
  })

  it("should export with additional column", () => {
    const result = exportFormAttributesToEnterprise(context, mockRule, withAdditionalColumnFormAttribute)

    expect(result).toEqual(withAdditionalColumnFormAttributeEnterprise)
  })
})
