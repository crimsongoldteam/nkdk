import { describe, expect, it } from "vitest"

import {
  readAppliedObjectFixture,
  testPropertyFromXMLToYAML,
} from "../../../../tests/directConversion"
import type { MetadataItemRule } from "../../../orchestration/property/types"
import { fullUseRestrictionYAML } from "./__fixtures__/data"

import "./types"

const rule = {
  itemType: "CalculatedFieldUseRestrictionProbe",
  properties: {
    value: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
    },
  },
} as MetadataItemRule

describe("CalculatedFieldUseRestriction XML → YAML", () => {
  it("imports full.xml and exports full YAML", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "full.xml")
    const result = testPropertyFromXMLToYAML({ rule, xml })

    expect(result.yaml).toEqual({ ОграничениеИспользования: fullUseRestrictionYAML })
  })
})
