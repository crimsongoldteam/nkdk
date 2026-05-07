import { describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  choiceListFormAttributeYAML,
  fullFormAttributes,
  fullFormAttributesYAML,
  mainAttributeTitleEqualsName,
  mainAttributeTitleEqualsNameYAML,
  minimalFormAttributes,
  minimalFormAttributesYAML,
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
import { importFormAttributesFromYAML } from "./fromYAML"

describe("importFormAttributesFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, fullFormAttributesYAML)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, minimalFormAttributesYAML)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import with short format", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, shortFormAttributeYAML)

    expect(result).toEqual(shortFormAttribute)
  })

  it("should import title when mainAttribute=true and title equals name", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, mainAttributeTitleEqualsNameYAML)

    expect(result).toEqual(mainAttributeTitleEqualsName)
  })

  it("should import choice list", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, choiceListFormAttributeYAML)

    expect(result).toEqual(choiceListFormAttribute)
  })

  it("should import with empty settings", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, withEmptySettingsFormAttributeYAML)

    expect(result).toEqual(withEmptySettingsFormAttribute)
  })

  // it("should import with dynamic list", () => {
  //   const result = importFormAttributesFromYAML(mockContext, mockRule, withDynamicListFormAttributeYAML)

  //   expect(result).toEqual(withDynamicListFormAttribute)
  // })

  it("should import table with columns", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, tableWithColumnsFormAttributeYAML)

    expect(result).toEqual(tableWithColumnsFormAttribute)
  })

  it("should import tree with column", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, treeWithColumnFormAttributeYAML)

    expect(result).toEqual(treeWithColumnFormAttribute)
  })

  it("should import with functional options", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, withFunctionalOptionsFormAttributeYAML)

    expect(result).toEqual(withFunctionalOptionsFormAttribute)
  })

  it("should import with additional column", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, withAdditionalColumnFormAttributeYAML)

    expect(result).toEqual(withAdditionalColumnFormAttribute)
  })

  it("should import mixed columns", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, mixedColumnsFormAttributeYAML)

    expect(result).toEqual(mixedColumnsFormAttribute)
  })
})
