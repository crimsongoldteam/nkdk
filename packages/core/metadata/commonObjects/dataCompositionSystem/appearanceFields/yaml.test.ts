import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import { importAppearanceFieldsFromYAML } from "./fromYAML"
import { exportAppearanceFieldsToYAML } from "./toYAML"

describe("AppearanceFields YAML", () => {
  it("export → import (roundtrip)", () => {
    const yaml = exportAppearanceFieldsToYAML(mockContext, fixtureAppearanceFields)
    expect(importAppearanceFieldsFromYAML(mockContext, yaml)).toEqual(fixtureAppearanceFields)
  })
})
