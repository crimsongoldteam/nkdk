import { describe, expect, it } from "vitest"

import { composeMetadataItemRule, metadataRuleFragment } from "./metadataRuleFragment"

describe("composeMetadataItemRule", () => {
  it("сохраняет порядок и исходные property rules без преобразования", () => {
    const firstRule = { type: "string", xml: "First" } as const
    const secondRule = { type: "boolean", xml: "Second" } as const
    const result = composeMetadataItemRule(
      { itemType: "Probe" },
      metadataRuleFragment(["first"], { first: firstRule }),
      metadataRuleFragment(["second"], { second: secondRule })
    )

    expect(result.xmlOrder).toEqual(["first", "second"])
    expect(result.properties.first).toBe(firstRule)
    expect(result.properties.second).toBe(secondRule)
  })

  it("сохраняет порядок и свойства фрагментов", () => {
    const rule = composeMetadataItemRule(
      { itemType: "Probe" },
      metadataRuleFragment(["name"], { name: { type: "string", xml: "Name" } }),
      metadataRuleFragment(["uuid"], { uuid: { type: "string", xml: "_uuid" } })
    )

    expect(rule.xmlOrder).toEqual(["name", "uuid"])
    expect(Object.keys(rule.properties)).toEqual(["name", "uuid"])
    const nameRule: { readonly type: "string"; readonly xml: "Name" } = rule.properties.name
    expect(nameRule.xml).toBe("Name")
  })

  it.each([
    [
      "свойство",
      () =>
        composeMetadataItemRule(
          { itemType: "Probe" },
          metadataRuleFragment(["name"], { name: { type: "string" } }),
          metadataRuleFragment(["name"], { name: { type: "string" } })
        ),
    ],
    ["порядок", () => metadataRuleFragment(["name", "name"], { name: { type: "string" } })],
  ])("отклоняет повтор: %s", (_name, compose) => {
    expect(compose).toThrow(/повтор/i)
  })

  it("отклоняет несовпадение properties и xmlOrder", () => {
    expect(() =>
      metadataRuleFragment(["name"], {
        name: { type: "string" },
        comment: { type: "string" },
      })
    ).toThrow(/comment/)
  })
})
