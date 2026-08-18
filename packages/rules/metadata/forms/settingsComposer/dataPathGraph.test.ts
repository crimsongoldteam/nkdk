import { describe, expect, it } from "vitest"

import {
  SETTINGS_COMPOSER_TYPE,
  settingsComposerGraph,
  settingsComposerNamePairs,
} from "./dataPathGraph"

const member = (type: string, name: string) =>
  settingsComposerGraph.find((candidate) => candidate.type === type)?.members.find(
    (candidate) => candidate.internal === name,
  )

describe("SettingsComposer typed data path graph", () => {
  it("keeps the complete standard name catalog", () => {
    expect(settingsComposerNamePairs).toHaveLength(68)
    expect(settingsComposerNamePairs).toContainEqual(["Settings", "Настройки"])
    expect(settingsComposerNamePairs).toContainEqual(["RightValue", "ПравоеЗначение"])
  })

  it("models the composer root as structured and real nested lists as collections", () => {
    expect(settingsComposerGraph.find(({ type }) => type === SETTINGS_COMPOSER_TYPE)).toMatchObject({
      members: expect.any(Array),
    })
    expect(member(SETTINGS_COMPOSER_TYPE, "Settings")?.target)
      .toEqual({ kind: "collection", itemType: "DataCompositionSettings" })
    expect(member("DataCompositionSettings", "Filter")?.target)
      .toEqual({ kind: "collection", itemType: "DataCompositionFilter" })
  })

  it("keeps terminal types and rejects unknown members", () => {
    expect(member("DataCompositionFilter", "ComparisonType")?.target)
      .toEqual({ kind: "terminal", terminalTypes: ["DataCompositionComparisonType"] })
    expect(member("DataCompositionGroupFields", "BeginOfPeriod")?.target)
      .toEqual({
        kind: "terminal",
        terminalTypes: ["Field", "dateTime", "DataCompositionPeriodAdditionType"],
      })
    expect(member("DataCompositionFilter", "Unknown")).toBeUndefined()
  })
})
