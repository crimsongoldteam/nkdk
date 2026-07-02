import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
import { aggregates, aggregatesYAML } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"

describe("import AccumulationRegisterAggregates from YAML", () => {
  it("imports aggregate dimensions from a YAML map keyed by dimension name", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: aggregatesYAML,
      rule: AccumulationRegisterAggregatesRules,
      name: "Aggregates",
    })

    expect(result).toEqual(aggregates)
  })
})
