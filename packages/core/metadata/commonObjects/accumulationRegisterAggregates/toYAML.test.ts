import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { aggregates, aggregatesYAML } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"

describe("export AccumulationRegisterAggregates to YAML", () => {
  it("exports aggregate dimensions as a YAML map keyed by dimension name", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data: aggregates,
      rule: AccumulationRegisterAggregatesRules,
    })

    expect(result).toEqual(aggregatesYAML)
  })
})
