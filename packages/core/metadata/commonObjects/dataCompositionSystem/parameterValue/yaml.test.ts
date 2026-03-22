import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  fixtureChoiceParameterLinksRoot,
  fixtureFullSettingsParameter,
  fixtureTypeLinkParameter,
  fixtureUseFalseColor,
} from "./__fixtures__/data"
import { importParameterValueFromYAML } from "./fromYAML"
import { exportParameterValueToYAML } from "./toYAML"
import type { SettingsParameterValuePropertyRule } from "./types"

const rule = (
  valueType: SettingsParameterValuePropertyRule["valueType"],
  typeSE?: SettingsParameterValuePropertyRule["typeSE"]
): SettingsParameterValuePropertyRule =>
  ({
    type: "SettingsParameterValue",
    valueType,
    ...(typeSE !== undefined ? { typeSE } : {}),
  }) as SettingsParameterValuePropertyRule

describe("SettingsParameterValue YAML", () => {
  it("export → import (useFalse / Color)", () => {
    const yaml = exportParameterValueToYAML({
      context: mockContext,
      rule: rule("Color"),
      data: fixtureUseFalseColor,
    })
    expect(importParameterValueFromYAML(mockContext, rule("Color"), yaml)).toEqual(fixtureUseFalseColor)
  })

  it("export → import (full / DesignTimeValue)", () => {
    const yaml = exportParameterValueToYAML({
      context: mockContext,
      rule: rule("DesignTimeValue"),
      data: fixtureFullSettingsParameter,
    })
    expect(importParameterValueFromYAML(mockContext, rule("DesignTimeValue"), yaml)).toEqual(fixtureFullSettingsParameter)
  })

  it("export → import (typeLink / TypeLink)", () => {
    const yaml = exportParameterValueToYAML({
      context: mockContext,
      rule: rule("TypeLink"),
      data: fixtureTypeLinkParameter,
    })
    expect(importParameterValueFromYAML(mockContext, rule("TypeLink"), yaml)).toEqual(fixtureTypeLinkParameter)
  })

  it("export → import (choiceParameterLinks)", () => {
    const yaml = exportParameterValueToYAML({
      context: mockContext,
      rule: rule("ChoiceParameterLinks"),
      data: fixtureChoiceParameterLinksRoot,
    })
    expect(importParameterValueFromYAML(mockContext, rule("ChoiceParameterLinks"), yaml)).toEqual(
      fixtureChoiceParameterLinksRoot
    )
  })
})
