import { markYAMLValueTag, yamlValueTag } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

import {
  exportPredefinedExtensionState,
  importPredefinedExtensionState,
} from "./extensionState"

describe("режим предопределённого элемента расширения", () => {
  it.each([
    ["", undefined],
    ["<ExtensionState/>", undefined],
    ["<ExtensionState>AdoptedCheck</ExtensionState>", undefined],
    ["<ExtensionState>AdoptedNotify</ExtensionState>", "проверять"],
  ])("читает структурное состояние %s", (content, expected) => {
    const yaml = { Код: "000000001" }
    importPredefinedExtensionState(parseStructuralXMLWithoutCompatibility(`<Item>${content}</Item>`), yaml)
    expect(yamlValueTag(yaml)).toBe(expected)
  })

  it("отклоняет неизвестное структурное состояние", () => {
    const xml = parseStructuralXMLWithoutCompatibility("<Item><ExtensionState>Unknown</ExtensionState></Item>")
    expect(() => importPredefinedExtensionState(xml, {})).toThrow("Неизвестный ExtensionState предопределённого элемента: Unknown")
  })

  it("не выбирает первое из повторных состояний", () => {
    const xml = parseStructuralXMLWithoutCompatibility("<Item><ExtensionState>AdoptedCheck</ExtensionState><ExtensionState>AdoptedNotify</ExtensionState></Item>")
    expect(() => importPredefinedExtensionState(xml, {})).toThrow("Неизвестный ExtensionState")
  })

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
