import { describe, expect, it } from "vitest"
import { createConfigurationLanguages } from "../context/types"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { yamlScalarTagAt } from "../../yaml/scalarTags"
import { validateLocalizedTextYAMLProperty } from "./localizedTextYAML"

const languages = createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] })

function issuesFor(source: string, foldable = false) {
  const parsed = parseMetadataYaml(source)
  const owner = parsed.data as Record<string, unknown>
  return validateLocalizedTextYAMLProperty({
    languages,
    value: owner.Заголовок,
    valueTag: yamlScalarTagAt(owner, "Заголовок"),
    path: ["Заголовок"],
    foldable,
  })
}

describe("validateLocalizedTextYAMLProperty", () => {
  it.each([
    {
      name: "unregistered language without tag",
      source: "Заголовок:\n  ru: Текст\n  de: Text",
      path: ["Заголовок", "de"],
      message: "незарегистрирован",
    },
    {
      name: "redundant language tag",
      source: "Заголовок:\n  ru: Текст\n  en: !xml/language Text",
      path: ["Заголовок", "en"],
      message: "избыточ",
    },
    {
      name: "duplicate tag on unregistered language",
      source: "Заголовок:\n  ru: Текст\n  de: !xml/duplicate Text",
      path: ["Заголовок", "de"],
      message: "!xml/duplicate",
    },
    {
      name: "noncanonical order without tag",
      source: "Заголовок:\n  en: Text\n  ru: Текст",
      path: ["Заголовок"],
      message: "порядок",
    },
    {
      name: "redundant order tag",
      source: "Заголовок: !xml/order\n  ru: Текст\n  en: Text",
      path: ["Заголовок"],
      message: "избыточ",
    },
  ])("reports $name", ({ source, path, message }) => {
    expect(issuesFor(source)).toEqual([
      expect.objectContaining({ path, message: expect.stringMatching(new RegExp(message, "iu")) }),
    ])
  })

  it("reports independent language and order anomalies", () => {
    const issues = issuesFor("Заголовок:\n  de: Text\n  ru: Текст")

    expect(issues.map(({ path }) => path)).toEqual([
      ["Заголовок", "de"],
      ["Заголовок"],
    ])
  })

  it.each([
    ["canonical mapping", "Заголовок:\n  ru: Текст\n  en: Text", false],
    ["classified unregistered language", "Заголовок:\n  ru: Текст\n  de: !xml/language Text", false],
    ["classified duplicate", "Заголовок:\n  ru: !xml/duplicate Текст\n  en: Text", false],
    ["classified order", "Заголовок: !xml/order\n  en: Text\n  ru: Текст", false],
    ["folded default participates first", "Заголовок:\n  en: Text", true],
    ["absent default marker", 'Заголовок:\n  ru: ""\n  en: Text', true],
    ["service code", "Заголовок:\n  '#': Service\n  en: Text", false],
    ["empty service code", 'Заголовок:\n  "": Service\n  en: Text', false],
  ])("accepts $name", (_name, source, foldable) => {
    expect(issuesFor(source, foldable)).toEqual([])
  })

  it.each([
    {
      name: "default marker after another language",
      source: 'Заголовок:\n  en: Text\n  ru: ""',
      foldable: true,
      path: ["Заголовок", "ru"],
    },
    {
      name: "default marker with order tag",
      source: 'Заголовок: !xml/order\n  ru: ""\n  en: Text',
      foldable: true,
      path: ["Заголовок", "ru"],
    },
    {
      name: "empty ordinary value",
      source: 'Заголовок:\n  ru: ""',
      foldable: false,
      path: ["Заголовок", "ru"],
    },
  ])("rejects $name", ({ source, foldable, path }) => {
    expect(issuesFor(source, foldable)).toEqual(expect.arrayContaining([
      expect.objectContaining({ path }),
    ]))
  })
})
