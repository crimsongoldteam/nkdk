import { describe, expect, it } from "vitest"
import "../register"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { TopLevelMetadataItemRules } from "../appliedObjects/configuration/topLevelRules"
import {
  configurationValidationProjectSpec,
  getValidationProjectSpecByDir,
  validationProjectSpecByDir,
  validationProjectSpecs,
} from "../validation/projectSpecs"
import {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecByDir,
  metadataProjectSpecs,
} from "./specs"

describe("metadata project specs", () => {
  it("builds specs for every top-level metadata item with YAML directory", () => {
    const topLevelDirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : []
    ).sort((left, right) => left.localeCompare(right, "ru"))

    const projectDirs = metadataProjectSpecs
      .map((spec) => spec.dir)
      .sort((left, right) => left.localeCompare(right, "ru"))

    expect(projectDirs).toEqual(topLevelDirs)
  })

  it("exposes configuration spec separately from top-level object directories", () => {
    expect(configurationMetadataProjectSpec).toMatchObject({
      kind: "configuration",
      dir: "",
      rule: MetadataConfigurationRules,
    })
    expect(metadataProjectSpecs.map((spec) => spec.dir)).not.toContain("")
  })

  it("resolves specs by YAML directory", () => {
    expect(getMetadataProjectSpecByDir("Справочник")).toMatchObject({
      dir: "Справочник",
      kind: "catalog",
    })
    expect(getMetadataProjectSpecByDir("НетТакогоВида")).toBeUndefined()
  })

  it("keeps validation compatibility aliases pointing to project specs", () => {
    expect(validationProjectSpecByDir).toBe(metadataProjectSpecByDir)
    expect(validationProjectSpecByDir.get("Справочник")).toBe(getMetadataProjectSpecByDir("Справочник"))
    expect(validationProjectSpecs).toBe(metadataProjectSpecs)
    expect(configurationValidationProjectSpec).toBe(configurationMetadataProjectSpec)
    expect(getValidationProjectSpecByDir).toBe(getMetadataProjectSpecByDir)
  })

  it("comes from object registrations, including custom import/export specs", () => {
    expect(configurationMetadataProjectSpec.kind).toBe("configuration")
    expect(configurationMetadataProjectSpec.dir).toBe("")

    expect(getMetadataProjectSpecByDir("Справочник")).toMatchObject({ kind: "catalog", dir: "Справочник" })
    expect(getMetadataProjectSpecByDir("Документ")).toMatchObject({ kind: "document", dir: "Документ" })
    expect(getMetadataProjectSpecByDir("Перечисление")).toMatchObject({ kind: "enumeration", dir: "Перечисление" })

    expect(metadataProjectSpecs.map((spec) => spec.dir)).toEqual(
      expect.arrayContaining(["Справочник", "Документ", "Перечисление"])
    )
  })
})
