import { describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { TopLevelMetadataItemRules } from "../appliedObjects/configuration/topLevelRules"
import {
  getConfigurationValidationProjectSpec,
  getValidationProjectSpecByDir,
  getValidationProjectSpecs,
} from "../validation/projectSpecs"
import {
  getConfigurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  getMetadataProjectSpecs,
} from "./specs"

describe("metadata project specs", () => {
  it("builds specs for every top-level metadata item with YAML directory", () => {
    const topLevelDirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : []
    ).sort((left, right) => left.localeCompare(right, "ru"))

    const projectDirs = getMetadataProjectSpecs()
      .map((spec) => spec.dir)
      .sort((left, right) => left.localeCompare(right, "ru"))

    expect(projectDirs).toEqual(topLevelDirs)
  })

  it("exposes configuration spec separately from top-level object directories", () => {
    expect(getConfigurationMetadataProjectSpec()).toMatchObject({
      kind: "configuration",
      dir: "",
      rule: MetadataConfigurationRules,
    })
    expect(getMetadataProjectSpecs().map((spec) => spec.dir)).not.toContain("")
  })

  it("resolves specs by YAML directory", () => {
    expect(getMetadataProjectSpecByDir("Справочник")).toMatchObject({
      dir: "Справочник",
      kind: "catalog",
    })
    expect(getMetadataProjectSpecByDir("НетТакогоВида")).toBeUndefined()
  })

  it("registers validation specs from the project definition snapshot", () => {
    expect(getValidationProjectSpecs()).toEqual(getMetadataProjectSpecs())
    expect(getConfigurationValidationProjectSpec()).toBe(getConfigurationMetadataProjectSpec())
    expect(getValidationProjectSpecByDir("Справочник")).toBe(getMetadataProjectSpecByDir("Справочник"))
  })

  it("comes from object registrations, including custom import/export specs", () => {
    expect(getConfigurationMetadataProjectSpec().kind).toBe("configuration")
    expect(getConfigurationMetadataProjectSpec().dir).toBe("")

    expect(getMetadataProjectSpecByDir("Справочник")).toMatchObject({ kind: "catalog", dir: "Справочник" })
    expect(getMetadataProjectSpecByDir("Документ")).toMatchObject({ kind: "document", dir: "Документ" })
    expect(getMetadataProjectSpecByDir("Перечисление")).toMatchObject({ kind: "enumeration", dir: "Перечисление" })

    expect(getMetadataProjectSpecs().map((spec) => spec.dir)).toEqual(
      expect.arrayContaining(["Справочник", "Документ", "Перечисление"])
    )
  })
})
