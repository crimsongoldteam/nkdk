import { expect, it } from "vitest"

import type { MetadataItemRule } from "./types"
import {
  registerTypeRule,
  resolvePropertyItemRule,
} from "./typeRuleRegistry"

const itemRule = (itemType: string): MetadataItemRule => ({
  itemType,
  properties: {},
})

it("выбирает явный itemRule раньше fallback и регистрации", () => {
  const explicit = itemRule("Explicit")
  const fallback = itemRule("Fallback")
  const registered = itemRule("Registered")
  registerTypeRule("ResolverPrecedenceProbe", "collectionItemRule", {
    itemRule: registered,
  })

  expect(
    resolvePropertyItemRule(
      { type: "ResolverPrecedenceProbe", itemRule: explicit },
      fallback
    )
  ).toBe(explicit)
  expect(
    resolvePropertyItemRule({ type: "ResolverPrecedenceProbe" }, fallback)
  ).toBe(fallback)
  expect(
    resolvePropertyItemRule({ type: "ResolverPrecedenceProbe" })
  ).toBe(registered)
})
