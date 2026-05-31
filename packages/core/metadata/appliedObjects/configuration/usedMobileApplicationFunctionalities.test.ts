import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { mockContext, mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration } from "./types"
import {
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  exportUsedMobileApplicationFunctionalitiesToXML,
  exportUsedMobileApplicationFunctionalitiesToYAML,
  importUsedMobileApplicationFunctionalitiesFromXML,
  importUsedMobileApplicationFunctionalitiesFromYAML,
  UsedMobileApplicationFunctionalitiesYAML,
} from "./usedMobileApplicationFunctionalities"

const cleanDefaultXML = () => ({
  "app:functionality": CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => ({
    "app:functionality": item.functionality,
    "app:use": item.use,
  })),
})

const modelWithDifferences = () =>
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => {
    if (item.functionality === "Biometrics") return { ...item, use: false }
    if (item.functionality === "Camera") return { ...item, use: true }
    return { ...item }
  })

const yamlDifferences: UsedMobileApplicationFunctionalitiesYAML = [
  { Функциональность: "Биометрия", Использовать: "Ложь" },
  { Функциональность: "Камера", Использовать: "Истина" },
]

describe("UsedMobileApplicationFunctionalities", () => {
  it("imports clean XML default as undefined", () => {
    const result = importUsedMobileApplicationFunctionalitiesFromXML(
      mockContext,
      undefined,
      cleanDefaultXML()
    )

    expect(result).toBeUndefined()
  })

  it("keeps clean XML default in reference import", () => {
    const result = importUsedMobileApplicationFunctionalitiesFromXML(
      mockContextFromXML({ forReference: true }),
      undefined,
      cleanDefaultXML()
    )

    expect(result).toEqual(CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES)
  })

  it("exports undefined model value as full clean XML default", () => {
    const result = exportUsedMobileApplicationFunctionalitiesToXML(mockContext, undefined, undefined)

    expect(result).toEqual(cleanDefaultXML())
  })

  it("exports explicit undefined model value through metadataItem as full clean XML default", () => {
    const configuration: MetadataConfiguration = {
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
      usedMobileApplicationFunctionalities: undefined,
    }

    const result = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: configuration,
      rule: MetadataConfigurationRules,
    })

    expect(result).toMatchObject({
      MetaDataObject: {
        Configuration: {
          Properties: {
            UsedMobileApplicationFunctionalities: cleanDefaultXML(),
          },
        },
      },
    })
  })

  it("exports YAML differences with Russian boolean values", () => {
    const result = exportUsedMobileApplicationFunctionalitiesToYAML(
      mockContext,
      undefined,
      modelWithDifferences()
    )

    expect(result).toEqual(yamlDifferences)
  })

  it("imports YAML differences into full model merged with clean default", () => {
    const result = importUsedMobileApplicationFunctionalitiesFromYAML(
      mockContext,
      undefined,
      yamlDifferences
    )

    expect(result).toEqual(modelWithDifferences())
    expect(result?.find((item) => item.functionality === "OSBackup")).toEqual({
      functionality: "OSBackup",
      use: true,
    })
  })

  it("exports clean default YAML as undefined", () => {
    const result = exportUsedMobileApplicationFunctionalitiesToYAML(
      mockContext,
      undefined,
      CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    )

    expect(result).toBeUndefined()
  })
})
