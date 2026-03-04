import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialYAML,
  minimalDendrogramField,
  minimalDendrogramFieldPartialYAML,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"

describe("importDendrogramFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "DendrogramField",
      yaml: fullDendrogramFieldPartialYAML,
      source: fullDendrogramField,
    })

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "DendrogramField",
      yaml: minimalDendrogramFieldPartialYAML,
      source: minimalDendrogramField,
    })

    expect(result).toEqual(minimalDendrogramField)
  })
})
