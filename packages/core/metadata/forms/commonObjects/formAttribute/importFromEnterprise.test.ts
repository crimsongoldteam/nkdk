import { describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  choiceListFormAttributeEnterprise,
  fullFormAttributes,
  fullFormAttributesEnterprise,
  mainAttributeTitleEqualsName,
  mainAttributeTitleEqualsNameEnterprise,
  minimalFormAttributes,
  minimalFormAttributesEnterprise,
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
import { importFormAttributesFromEnterprise } from "./importFromEnterprise"

describe("importFormAttributesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, fullFormAttributesEnterprise)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, minimalFormAttributesEnterprise)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import with short format", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, shortFormAttributeEnterprise)

    expect(result).toEqual(shortFormAttribute)
  })

  it("should import title when mainAttribute=true and title equals name", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, mainAttributeTitleEqualsNameEnterprise)

    expect(result).toEqual(mainAttributeTitleEqualsName)
  })

  it("should import choice list", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, choiceListFormAttributeEnterprise)

    expect(result).toEqual(choiceListFormAttribute)
  })

  it("should import with empty settings", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, withEmptySettingsFormAttributeEnterprise)

    expect(result).toEqual(withEmptySettingsFormAttribute)
  })

  it("should import with dynamic list", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, withDynamicListFormAttributeEnterprise)

    expect(result).toEqual(withDynamicListFormAttribute)
  })

  it("should import table with columns", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, tableWithColumnsFormAttributeEnterprise)

    expect(result).toEqual(tableWithColumnsFormAttribute)
  })

  it("should import tree with column", () => {
    const result = importFormAttributesFromEnterprise(mockContext, mockRule, treeWithColumnFormAttributeEnterprise)

    expect(result).toEqual(treeWithColumnFormAttribute)
  })

  it("should import with functional options", () => {
    const result = importFormAttributesFromEnterprise(
      mockContext,
      mockRule,
      withFunctionalOptionsFormAttributeEnterprise
    )

    expect(result).toEqual(withFunctionalOptionsFormAttribute)
  })

  it("should import with additional column", () => {
    const result = importFormAttributesFromEnterprise(
      mockContext,
      mockRule,
      withAdditionalColumnFormAttributeEnterprise
    )

    expect(result).toEqual(withAdditionalColumnFormAttribute)
  })
})
