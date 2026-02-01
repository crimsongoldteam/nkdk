import { describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  choiceListFormAttributeEnterprise,
  fullFormAttributes,
  fullFormAttributesEnterprise,
  mainAttributeTitleEqualsName,
  mainAttributeTitleEqualsNameEnterprise,
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
import { mockContext } from "~/tests/mockContext"
import { exportFormAttributesToEnterprise } from "./exportToEnterprise"

describe("exportFormAttributesToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFormAttributesToEnterprise(mockContext, fullFormAttributes)

    expect(result).toEqual(fullFormAttributesEnterprise)
  })

  it("should export with short format", () => {
    const result = exportFormAttributesToEnterprise(mockContext, shortFormAttribute)

    expect(result).toEqual(shortFormAttributeEnterprise)
  })

  it("should export title when mainAttribute=true and title equals name", () => {
    const result = exportFormAttributesToEnterprise(mockContext, mainAttributeTitleEqualsName)

    expect(result).toEqual(mainAttributeTitleEqualsNameEnterprise)
  })

  it("should export choice list", () => {
    const result = exportFormAttributesToEnterprise(mockContext, choiceListFormAttribute)

    expect(result).toEqual(choiceListFormAttributeEnterprise)
  })

  it("should export with empty settings", () => {
    const result = exportFormAttributesToEnterprise(mockContext, withEmptySettingsFormAttribute)

    expect(result).toEqual(withEmptySettingsFormAttributeEnterprise)
  })

  it("should export with dynamic list", () => {
    const result = exportFormAttributesToEnterprise(mockContext, withDynamicListFormAttribute)

    expect(result).toEqual(withDynamicListFormAttributeEnterprise)
  })

  it("should export table with columns", () => {
    const result = exportFormAttributesToEnterprise(mockContext, tableWithColumnsFormAttribute)

    expect(result).toEqual(tableWithColumnsFormAttributeEnterprise)
  })

  it("should export tree with column", () => {
    const result = exportFormAttributesToEnterprise(mockContext, treeWithColumnFormAttribute)

    expect(result).toEqual(treeWithColumnFormAttributeEnterprise)
  })

  it("should export with functional options", () => {
    const result = exportFormAttributesToEnterprise(mockContext, withFunctionalOptionsFormAttribute)

    expect(result).toEqual(withFunctionalOptionsFormAttributeEnterprise)
  })

  it("should export with additional column", () => {
    const result = exportFormAttributesToEnterprise(mockContext, withAdditionalColumnFormAttribute)

    expect(result).toEqual(withAdditionalColumnFormAttributeEnterprise)
  })
})
