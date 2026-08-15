import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createConfigurationLanguages, rehydrateConfigurationContext } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import {
  loadConfigurationLanguagesFromXML,
  loadConfigurationLanguagesFromYAML,
} from "./languageRegistry"

describe("createConfigurationLanguages", () => {
  it("создаёт неизменяемый реестр со стабильной версией", () => {
    const registered = ["ru", "en"]
    const languages = createConfigurationLanguages({ default: "ru", registered })
    registered.push("de")

    expect(languages.default).toBe("ru")
    expect(languages.registered).toEqual(["ru", "en"])
    expect(languages.registeredSet.has("en")).toBe(true)
    expect(languages.version).toBe(JSON.stringify(["ru", ["en", "ru"]]))
    expect(Object.isFrozen(languages)).toBe(true)
    expect(Object.isFrozen(languages.registered)).toBe(true)
    expect(Object.isFrozen(languages.registeredSet)).toBe(true)
    expect(() => (languages.registeredSet as Set<string>).add("de")).toThrow()
    expect(() => (languages.registeredSet as Set<string>).delete("en")).toThrow()
    expect(() => (languages.registeredSet as Set<string>).clear()).toThrow()
    expect(() => Set.prototype.add.call(languages.registeredSet, "de")).toThrow()
    expect([...languages.registeredSet]).toEqual(["ru", "en"])
    expect(structuredClone(languages)).toMatchObject({
      default: "ru",
      registered: ["ru", "en"],
      version: JSON.stringify(["ru", ["en", "ru"]]),
    })
  })

  it.each([
    ["пустой основной код", { default: "", registered: ["ru"] }],
    ["пустой зарегистрированный код", { default: "ru", registered: ["ru", ""] }],
    ["повтор кода", { default: "ru", registered: ["ru", "ru"] }],
    ["основной код не зарегистрирован", { default: "ru", registered: ["en"] }],
  ])("отклоняет %s", (_name, params) => {
    expect(() => createConfigurationLanguages(params)).toThrow()
  })

  it("восстанавливает неизменяемый индекс после structured clone", () => {
    const source = {
      version: "test",
      languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
    }
    const cloned = structuredClone(source) as typeof source
    const restored = rehydrateConfigurationContext(cloned)

    expect(restored.languages.registeredSet.has("en")).toBe(true)
    expect(() => Set.prototype.add.call(restored.languages.registeredSet, "de")).toThrow()
  })
})

describe("сборщики реестра языков", () => {
  it("строят одинаковый реестр из XML и YAML", async () => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-language-registry-"))
    const xmlDir = join(root, "xml")
    const yamlDir = join(root, "yaml")
    try {
      await writeXmlConfiguration(xmlDir, "Language.Русский", ["Русский", "Английский"], {
        Русский: "ru",
        Английский: "en",
      })
      await writeYamlConfiguration(yamlDir, "Русский", {
        Русский: "ru",
        Английский: "en",
      })

      const xml = await loadConfigurationLanguagesFromXML(xmlDir)
      const yaml = await loadConfigurationLanguagesFromYAML(yamlDir)

      expect(xml).toEqual(yaml)
      expect(xml.registered).toEqual(["ru", "en"])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it.each(["xml", "yaml"] as const)("указывает путь при отсутствии основного объекта: %s", async (kind) => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-language-registry-missing-"))
    try {
      if (kind === "xml") {
        await writeXmlConfiguration(root, "Language.Русский", ["Английский"], { Английский: "en" })
      } else {
        await writeYamlConfiguration(root, "Русский", { Английский: "en" })
      }

      const load = kind === "xml"
        ? loadConfigurationLanguagesFromXML(root)
        : loadConfigurationLanguagesFromYAML(root)
      await expect(load).rejects.toThrow(kind === "xml" ? "Configuration.xml" : "Конфигурация.yaml")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("отклоняет два XML-объекта с именем основного языка", async () => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-language-registry-duplicate-name-"))
    try {
      await writeXmlConfiguration(root, "Language.Русский", ["Русский", "Русский"], { Русский: "ru" })

      await expect(loadConfigurationLanguagesFromXML(root)).rejects.toThrow("Configuration.xml")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it.each(["xml", "yaml"] as const)("указывает файл второго объекта при повторе кода: %s", async (kind) => {
    const root = await mkdtemp(join(tmpdir(), "nkdk-language-registry-duplicate-code-"))
    try {
      if (kind === "xml") {
        await writeXmlConfiguration(root, "Language.Русский", ["Русский", "Английский"], {
          Русский: "ru",
          Английский: "ru",
        })
      } else {
        await writeYamlConfiguration(root, "Русский", { Русский: "ru", Английский: "ru" })
      }

      const load = kind === "xml"
        ? loadConfigurationLanguagesFromXML(root)
        : loadConfigurationLanguagesFromYAML(root)
      await expect(load).rejects.toThrow(kind === "xml" ? "Английский.xml" : "Английский.yaml")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

async function writeXmlConfiguration(
  root: string,
  defaultLanguage: string,
  languageNames: readonly string[],
  codes: Readonly<Record<string, string>>,
): Promise<void> {
  await mkdir(join(root, "Languages"), { recursive: true })
  await writeFile(join(root, "Configuration.xml"), [
    "<MetaDataObject><Configuration>",
    `<Properties><DefaultLanguage>${defaultLanguage}</DefaultLanguage></Properties>`,
    `<ChildObjects>${languageNames.map((name) => `<Language>${name}</Language>`).join("")}</ChildObjects>`,
    "</Configuration></MetaDataObject>",
  ].join(""))
  await Promise.all(Object.entries(codes).map(([name, code]) =>
    writeFile(
      join(root, "Languages", `${name}.xml`),
      `<MetaDataObject><Language><Properties><LanguageCode>${code}</LanguageCode></Properties></Language></MetaDataObject>`,
    )))
}

async function writeYamlConfiguration(
  root: string,
  defaultLanguage: string,
  codes: Readonly<Record<string, string>>,
): Promise<void> {
  await mkdir(join(root, "Язык"), { recursive: true })
  await writeFile(join(root, "Конфигурация.yaml"), `ОсновнойЯзык: ${defaultLanguage}\n`)
  await Promise.all(Object.entries(codes).map(([name, code]) =>
    writeFile(join(root, "Язык", `${name}.yaml`), `КодЯзыка: ${code}\n`)))
}
