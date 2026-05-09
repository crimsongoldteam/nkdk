import { describe, expect, it } from "vitest"
import {
  catalogFullClientApplicationForm,
  catalogFullClientApplicationFormYAML,
  customSettingsFolderClientApplicationForm,
  customSettingsFolderClientApplicationFormYAML,
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
  minimalClientApplicationForm,
  minimalClientApplicationFormYAML,
} from "./__fixtures__/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportClientApplicationFormToYAML } from "./toYAML"

describe("exportClientApplicationFormToYAML", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = exportClientApplicationFormToYAML(mockContext, undefined)

  //   expect(result).toBeUndefined()
  // })

  it("should export all fields to YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, fullClientApplicationForm)

    expect(yaml).toEqual(fullClientApplicationFormYAML)
  })

  it("exports catalog full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, catalogFullClientApplicationForm)

    expect(yaml).toEqual(catalogFullClientApplicationFormYAML)
  })

  it("should export minimal", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, minimalClientApplicationForm)

    expect(yaml).toEqual(minimalClientApplicationFormYAML)
  })

  it("exports CustomSettingsFolder to YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, customSettingsFolderClientApplicationForm)

    expect((yaml as typeof customSettingsFolderClientApplicationFormYAML).ГруппаПользовательскихНастроек).toBe(
      customSettingsFolderClientApplicationFormYAML.ГруппаПользовательскихНастроек
    )
  })
})
