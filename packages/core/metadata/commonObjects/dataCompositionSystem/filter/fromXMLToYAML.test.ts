import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testPropertyFromXMLToYAML } from "../../../../tests/directConversion"
import type { MetadataItemRule } from "../../../orchestration/property/types"
import { fullFilterFixtureYAML } from "./__fixtures__/data"

import "./types"

const rule = {
  itemType: "FilterProbe",
  properties: {
    value: { type: "Filter", xml: "dcsset:filter", yaml: "Отбор" },
  },
} as MetadataItemRule

describe("Filter XML → YAML", () => {
  it("imports full XML and exports full YAML", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "full.xml")
    const result = testPropertyFromXMLToYAML({ rule, xml })

    expect(result.yaml).toEqual({ Отбор: fullFilterFixtureYAML })
  })
})
