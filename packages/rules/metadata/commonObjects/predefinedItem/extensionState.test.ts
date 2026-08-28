import { markYAMLValueTag, yamlValueTag } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"

import {
  exportPredefinedExtensionState,
  importPredefinedExtensionState,
} from "./extensionState"

describe("режим предопределённого элемента расширения", () => {
  it.each([
    ["AdoptedCheck", undefined],
    ["AdoptedNotify", "проверять"],
  ] as const)("импортирует %s", (state, expectedTag) => {
    const yaml = { Код: "000000001" }

    importPredefinedExtensionState({ ExtensionState: state }, yaml)

    expect(yamlValueTag(yaml)).toBe(expectedTag)
  })

  it("отклоняет неизвестный XML-режим", () => {
    expect(() => importPredefinedExtensionState({ ExtensionState: "Unknown" }, {}))
      .toThrow("Неизвестный ExtensionState предопределённого элемента: Unknown")
  })

  it.each([
    [undefined, true, "AdoptedCheck"],
    ["проверять", true, "AdoptedNotify"],
    [undefined, false, undefined],
  ] as const)("экспортирует tag=%s borrowed=%s", (tag, borrowed, expected) => {
    const yaml = { Код: "000000001" }
    if (tag !== undefined) markYAMLValueTag(yaml, tag)

    expect(exportPredefinedExtensionState({ yaml, borrowed })).toBe(expected)
  })

  it.each([
    ["изменять", true],
    ["проверять", false],
  ] as const)("отклоняет недопустимый tag=%s borrowed=%s", (tag, borrowed) => {
    const yaml = {}
    markYAMLValueTag(yaml, tag)

    expect(() => exportPredefinedExtensionState({ yaml, borrowed })).toThrow()
  })
})
