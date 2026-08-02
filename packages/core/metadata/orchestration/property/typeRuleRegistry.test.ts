import { expect, it } from "vitest"

import type { MetadataItemRule } from "./types"
import {
  clearTypeRulesRegistry,
  registerTypeRule,
  resolvePropertyItemRule,
} from "./typeRuleRegistry"

const itemRule = (itemType: string): MetadataItemRule => ({
  itemType,
  properties: {},
})

it("выбирает явный itemRule раньше fallback и регистрации", () => {
  clearTypeRulesRegistry()
  const explicit = itemRule("Explicit")
  const fallback = itemRule("Fallback")
  const registered = itemRule("Registered")
  registerTypeRule("Probe" as never, "collectionItemRule", {
    itemRule: registered,
  })

  expect(
    resolvePropertyItemRule({ type: "Probe", itemRule: explicit }, fallback)
  ).toBe(explicit)
  expect(resolvePropertyItemRule({ type: "Probe" }, fallback)).toBe(fallback)
  expect(resolvePropertyItemRule({ type: "Probe" })).toBe(registered)
})
