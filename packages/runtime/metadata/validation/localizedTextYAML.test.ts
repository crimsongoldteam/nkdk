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
  it("сообщает о незарегистрированном языке", () => {
    const source = "Заголовок:\n  ru: Текст\n  de: Text"
    expect(issuesFor(source)).toEqual([
      expect.objectContaining({
        path: ["Заголовок", "de"],
        message: expect.stringMatching(/незарегистрирован/iu),
      }),
    ])
  })

  it("не считает порядок языков предметной ошибкой", () => {
    const issues = issuesFor("Заголовок:\n  de: Text\n  ru: Текст")

    expect(issues.map(({ path }) => path)).toEqual([["Заголовок", "de"]])
  })

  it.each([
    ["canonical mapping", "Заголовок:\n  ru: Текст\n  en: Text", false],
    ["property state tag", "Заголовок: !проверять Текст", false],
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
