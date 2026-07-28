import { describe, expect, it } from "vitest"
import type { CanonicalRuleOrder } from "../../metadata/ruleOrderAnalysis/canonicalOrder"
import type { RuleOrderSource } from "../../metadata/ruleOrderAnalysis/types"
import { parseArguments, sourcesForRewrite } from "./index"

describe("parseArguments", () => {
  it("enables transactional rewrite only with --apply", () => {
    expect(parseArguments(["--xml-root", "/xml", "--output", "/out"])).toMatchObject({ apply: false })
    expect(parseArguments(["--apply", "--xml-root", "/xml", "--output", "/out"])).toMatchObject({
      apply: true,
    })
  })

  it("rejects a duplicate --apply flag", () => {
    expect(() =>
      parseArguments(["--apply", "--xml-root", "/xml", "--output", "/out", "--apply"])
    ).toThrow(/повторно/)
  })
})

describe("sourcesForRewrite", () => {
  it("передаёт переписчику наблюдавшиеся и ненаблюдавшиеся rules.ts без дубликатов", () => {
    const observed = source("b/rules.ts#Rules")
    const unobserved = source("a/rules.ts#Rules")
    const canonical: CanonicalRuleOrder = {
      source: observed,
      propertyKeys: ["name"],
      observationCount: 1,
    }

    expect(
      sourcesForRewrite({
        canonicalOrders: [canonical],
        unobservedSources: [unobserved],
      }).map((item) => item.candidate)
    ).toEqual(["a/rules.ts#Rules", "b/rules.ts#Rules"])
  })
})

function source(candidate: string): RuleOrderSource {
  return {
    candidate,
    filePath: `/${candidate.split("#")[0]}`,
    exportName: "Rules",
    propertyPath: [],
    declarationOrder: ["name"],
  }
}
