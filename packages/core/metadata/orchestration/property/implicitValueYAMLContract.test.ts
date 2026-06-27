import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { ButtonRules, CommandBarButtonRules } from "~/metadata/forms/elements/button/rules"
import { CalendarFieldRules } from "~/metadata/forms/elements/calendarField/rules"
import { ChartFieldRules } from "~/metadata/forms/elements/chartField/rules"
import { DendrogramFieldRules } from "~/metadata/forms/elements/dendrogramField/rules"
import { GeographicalSchemaFieldRules } from "~/metadata/forms/elements/geographicalSchemaField/rules"
import { GraphicalSchemaFieldRules } from "~/metadata/forms/elements/graphicalSchemaField/rules"
import { HTMLDocumentFieldRules } from "~/metadata/forms/elements/htmlDocumentField/rules"
import { InputFieldRules, TableInputFieldRules } from "~/metadata/forms/elements/inputField/rules"
import { PeriodFieldRules } from "~/metadata/forms/elements/periodField/rules"
import { ProgressBarFieldRules } from "~/metadata/forms/elements/progressBarField/rules"
import type { MetadataItemRule, PropertyRule } from "./types"

type RuleModule = Record<string, unknown>

const ruleModules = import.meta.glob<RuleModule>("../../**/rules.ts", { eager: true })

describe("implicitValueYAML contract", () => {
  it("accepts explicit noImplicitValueYAML for boolean and SystemEnumeration YAML properties", () => {
    const rule = {
      itemType: "MetadataConfiguration",
      properties: {
        flag: { type: "boolean", yaml: "Флаг", noImplicitValueYAML: true },
        mode: { type: "SystemEnumeration", typeSE: "ModalityUseMode", yaml: "Режим", noImplicitValueYAML: true },
      },
    } as const satisfies MetadataItemRule

    expect(collectMissingImplicitValueYAML(rule, "TestRules")).toEqual([])
  })

  it("requires configuration boolean and SystemEnumeration YAML properties to document implicit value decision", () => {
    expect(collectMissingImplicitValueYAML(MetadataConfigurationRules, "MetadataConfigurationRules")).toEqual([])
  })

  it("requires catalog boolean and SystemEnumeration YAML properties to document implicit value decision", () => {
    expect(collectMissingImplicitValueYAML(MetadataCatalogRules, "MetadataCatalogRules")).toEqual([])
  })

  it("uses enabled size flags as implicit YAML values for chart-like form fields", () => {
    const sizeFlags = ["autoMaxHeight", "autoMaxWidth", "horizontalStretch", "verticalStretch"] as const
    const rules = [
      ["ChartFieldRules", ChartFieldRules],
      ["DendrogramFieldRules", DendrogramFieldRules],
      ["GeographicalSchemaFieldRules", GeographicalSchemaFieldRules],
      ["GraphicalSchemaFieldRules", GraphicalSchemaFieldRules],
      ["HTMLDocumentFieldRules", HTMLDocumentFieldRules],
    ] as const

    const unexpected = rules.flatMap(([ruleName, rule]) =>
      sizeFlags
        .filter((propertyKey) => rule.properties[propertyKey].implicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for calendar field flags", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      border: "Single",
      calendarNavigation: true,
      enableDrag: false,
      enableStartDrag: false,
      height: 9,
      heightInMonths: 1,
      horizontalStretch: true,
      selectionMode: "Single",
      showCurrentDate: true,
      showMonthsPanel: false,
      titleHeight: 0,
      verticalStretch: true,
      width: 16,
      widthInMonths: 1,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return CalendarFieldRules.properties[propertyKey].implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `CalendarFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for period field size properties", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      border: "Single",
      height: 0,
      titleHeight: 0,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return PeriodFieldRules.properties[propertyKey].implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PeriodFieldRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch", "verticalStretch"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => PeriodFieldRules.properties[propertyKey].noImplicitValueYAML !== true)
      .map((propertyKey) => `PeriodFieldRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for form buttons", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      check: false,
      commandUniqueness: true,
      defaultButton: false,
      defaultItem: false,
      enabled: true,
      height: 0,
      horizontalStretch: false,
      maxHeight: 0,
      maxWidth: 0,
      titleHeight: 0,
      verticalStretch: false,
      visible: true,
      width: 0,
    } as const
    const expectedNoImplicitValueYAML = ["onlyInAllActions", "skipOnInput"] as const
    const rules = [
      ["ButtonRules", ButtonRules],
      ["CommandBarButtonRules", CommandBarButtonRules],
    ] as const

    const unexpectedImplicitValues = rules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedImplicitValues)
        .filter(([propertyKey, implicitValueYAML]) => {
          return rule.properties[propertyKey].implicitValueYAML !== implicitValueYAML
        })
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )

    const unexpectedNoImplicitValueYAML = rules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => rule.properties[propertyKey].noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for progress bar field limits", () => {
    const expected = {
      maxHeight: 0,
      maxValue: 100,
      maxWidth: 0,
      minValue: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return ProgressBarFieldRules.properties[propertyKey].implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ProgressBarFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for input fields", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      choiceListHeight: 0,
      chooseType: true,
      dropListWidth: 0,
      height: 0,
      listChoiceMode: false,
      textEdit: true,
      titleHeight: 0,
      width: 0,
      wrap: true,
    } as const
    const expectedNoImplicitValueYAML = [
      "autoChoiceIncomplete",
      "autoMarkIncomplete",
      "choiceButton",
      "choiceListButton",
      "clearButton",
      "createButton",
      "dropListButton",
      "extendedEdit",
      "horizontalStretch",
      "multiLine",
      "openButton",
      "passwordMode",
      "quickChoice",
      "skipOnInput",
      "spinButton",
      "verticalStretch",
    ] as const
    const rules = [
      ["InputFieldRules", InputFieldRules],
      ["TableInputFieldRules", TableInputFieldRules],
    ] as const

    const unexpectedImplicitValues = rules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedImplicitValues)
        .filter(([propertyKey, implicitValueYAML]) => {
          return rule.properties[propertyKey].implicitValueYAML !== implicitValueYAML
        })
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )

    const unexpectedNoImplicitValueYAML = rules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => rule.properties[propertyKey].noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("requires boolean and SystemEnumeration YAML properties with defaultValueXML to have implicitValueYAML", () => {
    const missing = collectRules().flatMap(({ exportName, rule }) =>
      collectMissingImplicitValueYAMLForXMLDefault(rule, exportName)
    )

    expect(missing).toEqual([])
  })

  it("uses zero as implicit YAML value for unset max size form properties", () => {
    const missing = collectRules().flatMap(({ exportName, rule }) =>
      collectMissingMaxSizeImplicitValueYAML(rule, exportName)
    )

    expect(missing).toEqual([])
  })
})

function collectRules(): Array<{ exportName: string; rule: MetadataItemRule }> {
  return Object.values(ruleModules).flatMap((module) =>
    Object.entries(module)
      .filter(([exportName, value]) => exportName.endsWith("Rules") && isMetadataItemRule(value))
      .map(([exportName, rule]) => ({ exportName, rule }))
  )
}

function collectMissingImplicitValueYAML(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([, propertyRule]) => needsImplicitValueDecision(propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingImplicitValueYAML(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function collectMissingImplicitValueYAMLForXMLDefault(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([, propertyRule]) => needsImplicitValueForXMLDefault(propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingImplicitValueYAMLForXMLDefault(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function collectMissingMaxSizeImplicitValueYAML(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([key, propertyRule]) => needsMaxSizeImplicitValueYAML(key, propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingMaxSizeImplicitValueYAML(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function needsImplicitValueDecision(rule: PropertyRule): boolean {
  if (rule.type !== "boolean" && rule.type !== "SystemEnumeration") return false
  if (!rule.yaml) return false
  if (rule.runtimeOnly === true || rule.syncExternalOnly === true) return false
  if (rule.toYAML === false && rule.fromYAML === false) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function needsImplicitValueForXMLDefault(rule: PropertyRule): boolean {
  if (rule.type !== "boolean" && rule.type !== "SystemEnumeration") return false
  if (!rule.yaml) return false
  if (!("defaultValueXML" in rule)) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function needsMaxSizeImplicitValueYAML(key: string, rule: PropertyRule): boolean {
  if (key !== "maxHeight" && key !== "maxWidth") return false
  if (rule.type !== "number") return false
  if (!rule.yaml) return false
  if (rule.runtimeOnly === true || rule.syncExternalOnly === true) return false
  if (rule.toYAML === false && rule.fromYAML === false) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function isMetadataItemRule(value: unknown): value is MetadataItemRule {
  if (value === null || typeof value !== "object") return false
  const candidate = value as Partial<MetadataItemRule>
  return typeof candidate.itemType === "string" && candidate.properties !== undefined
}
