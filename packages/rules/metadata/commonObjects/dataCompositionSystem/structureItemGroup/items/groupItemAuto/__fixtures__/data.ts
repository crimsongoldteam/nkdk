import type { GroupItemAuto, GroupItemAutoYAML } from "../types"

export const fixtureGroupItemAuto = {
  itemType: "GroupItemAuto",
} as const satisfies GroupItemAuto

export const fixtureGroupItemAutoYAML: GroupItemAutoYAML = "[Авто]"

export const fixtureGroupItemAutoUseFalse = {
  itemType: "GroupItemAuto",
  use: false,
} as const satisfies GroupItemAuto

export const fixtureGroupItemAutoUseFalseYAML: GroupItemAutoYAML = "([Авто])"
