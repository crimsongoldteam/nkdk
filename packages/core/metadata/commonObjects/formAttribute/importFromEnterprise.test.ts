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
  withDynamicListFormAttribute,
  withDynamicListFormAttributeEnterprise,
  withEmptySettingsFormAttribute,
  withEmptySettingsFormAttributeEnterprise,
  tableWithColumnsFormAttribute,
  tableWithColumnsFormAttributeEnterprise,
  treeWithColumnFormAttribute,
  treeWithColumnFormAttributeEnterprise,
  withFunctionalOptionsFormAttribute,
  withFunctionalOptionsFormAttributeEnterprise,
} from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormAttributesFromEnterprise } from "./importFromEnterprise"

describe("importFormAttributesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, fullFormAttributesEnterprise)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, minimalFormAttributesEnterprise)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import with short format", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, shortFormAttributeEnterprise)

    expect(result).toEqual(shortFormAttribute)
  })

  it("should import title when mainAttribute=true and title equals name", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, mainAttributeTitleEqualsNameEnterprise)

    expect(result).toEqual(mainAttributeTitleEqualsName)
  })

  it("should import choice list", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, choiceListFormAttributeEnterprise)

    expect(result).toEqual(choiceListFormAttribute)
  })

  it("should import with empty settings", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, withEmptySettingsFormAttributeEnterprise)

    expect(result).toEqual(withEmptySettingsFormAttribute)
  })

  it("should import with dynamic list", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, withDynamicListFormAttributeEnterprise)

    expect(result).toEqual(withDynamicListFormAttribute)
  })

  it("should import table with columns", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, tableWithColumnsFormAttributeEnterprise)

    // Reset IDs for comparison since Enterprise doesn't provide them
    const expected = tableWithColumnsFormAttribute.map(attr => ({
      ...attr,
      columns: attr.columns?.map(col => ({ ...col, id: "" }))
    }))

    expect(result).toEqual(expected)
  })

  it("should import tree with column", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, treeWithColumnFormAttributeEnterprise)

    // Reset IDs recursively for comparison
    const resetIds = (columns?: any[]): any[] | undefined =>
      columns?.map((col) => {
        const res = { ...col, id: "" }
        if (col.columns) res.columns = resetIds(col.columns)
        return res
      })

    const expected = treeWithColumnFormAttribute.map((attr) => ({
      ...attr,
      columns: resetIds(attr.columns),
    }))

    expect(result).toEqual(expected)
  })

  it("should import with functional options", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, withFunctionalOptionsFormAttributeEnterprise)

    expect(result).toEqual(withFunctionalOptionsFormAttribute)
  })
})
