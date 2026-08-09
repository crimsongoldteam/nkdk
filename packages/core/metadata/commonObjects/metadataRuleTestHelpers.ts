import { expect } from "vitest"

import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { getCompiledXMLPropertyOrder } from "../ruleRuntime/property/xmlPropertyOrder"

export function expectFinishedRuleOrder(rule: MetadataItemRule): void {
  expect(getCompiledXMLPropertyOrder(rule)).toEqual(rule.xmlOrder)
  expect(new Set(rule.xmlOrder).size).toBe(Object.keys(rule.properties).length)
}
