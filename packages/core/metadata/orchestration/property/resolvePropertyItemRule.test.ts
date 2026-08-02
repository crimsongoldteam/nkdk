import { expect, it } from "vitest"

import type { MetadataItemRule } from "./types"
import { resolvePropertyItemRule } from "./resolvePropertyItemRule"

function probeItemRule(itemType: string): MetadataItemRule {
  return { itemType, properties: {} }
}

it("выбирает явное правило свойства раньше зарегистрированного", () => {
  const explicit = probeItemRule("Explicit")
  const registered = probeItemRule("Registered")

  expect(resolvePropertyItemRule({ type: "Probe", itemRule: explicit }, registered)).toBe(explicit)
  expect(resolvePropertyItemRule({ type: "Probe" }, registered)).toBe(registered)
})
