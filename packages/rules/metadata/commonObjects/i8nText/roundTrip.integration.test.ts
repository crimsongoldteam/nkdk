import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import {
  importContentFromXML,
  serializeYAMLDocument,
  yamlMappingTagOf,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { loadConfigurationLanguagesFromXML } from "../../context/configurationLanguages"
import { exportLocalizedItems, importLocalizedItems } from "./anomalies"
import type { I8nTextLanguageXML } from "./types"

const corpusRoot = "/Users/nikita/git/round-trip-compact/cf"
const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe.skipIf(!existsSync(corpusRoot))("real localized XML anomalies", () => {
  it("сохраняет незарегистрированный en из Storekeeper", async () => {
    const fixture = copyConfigurationFragment({
      configuration: "StorekeeperDevelopers_2_0_108_1_setup1c",
      owner: "SessionParameters/ПоддерживаетсяТелефония.xml",
    })
    const items = onlyMatchingItems(fixture.ownerPath, [
      item("ru", "Поддерживается телефония"),
      item("en", "Available Telephone"),
    ])
    const context = { ...mockContext, languages: await loadConfigurationLanguagesFromXML(fixture.configurationDir) }

    const yaml = importLocalizedItems({ context, items })

    expect(yamlScalarTagAt(yaml, "en")).toBe("xml/language")
    expect(serializeYAMLDocument({ Синоним: yaml }).text).toContain("en: !xml/language Available Telephone")
    expect(exportLocalizedItems({ context, items: yaml })).toEqual(items)
  })

  it.each([
    {
      name: "SMTL 1.21.1",
      configuration: "SMTL_2_0_15_38_setup1c",
      owner: "XDTOPackages/EnterpriseData_1_21_1.xml",
      text: "EnterpriseData 1.21.1",
    },
    {
      name: "SMTL 1.22.1",
      configuration: "SMTL_2_0_15_38_setup1c",
      owner: "XDTOPackages/EnterpriseData_1_22_1.xml",
      text: "EnterpriseData 1.22.1",
    },
    {
      name: "ERP 1.20.2",
      configuration: "erp",
      owner: "XDTOPackages/EnterpriseData_1_20_2.xml",
      text: "EnterpriseData 1.20.2",
    },
  ])("сохраняет нарушенный порядок $name", async ({ configuration, owner, text }) => {
    const fixture = copyConfigurationFragment({ configuration, owner })
    const items = onlyMatchingItems(fixture.ownerPath, [item("en", text), item("ru", text)])
    const context = { ...mockContext, languages: await loadConfigurationLanguagesFromXML(fixture.configurationDir) }

    const yaml = importLocalizedItems({ context, items })

    expect(yamlMappingTagOf(yaml)).toBe("xml/order")
    expect(exportLocalizedItems({ context, items: yaml })).toEqual(items)
  })

  it("сохраняет три реальные пары-дубли Mhcsk", async () => {
    const fixture = copyConfigurationFragment({
      configuration: "Mhcsk_3_1_202_14_setup1c",
      owner: "DataProcessors/РаспознаваниеДокументовОтправкаФайлов/Forms/ФормированиеПакетаМК/Ext/Form.xml",
    })
    const expected = [item("ru", "Группа"), item("ru", "Группа")]
    const matches = matchingItems(fixture.ownerPath, expected)
    const context = { ...mockContext, languages: await loadConfigurationLanguagesFromXML(fixture.configurationDir) }

    expect(matches).toHaveLength(3)
    for (const items of matches) {
      const yaml = importLocalizedItems({ context, items })
      expect(yamlScalarTagAt(yaml, "ru")).toBe("xml/duplicate")
      expect(exportLocalizedItems({ context, items: yaml })).toEqual(items)
    }
  })
})

function copyConfigurationFragment(params: { configuration: string; owner: string }) {
  const sourceDir = join(corpusRoot, params.configuration)
  const configurationDir = mkdtempSync(join(tmpdir(), "nkdk-i18n-round-trip-"))
  tempDirs.push(configurationDir)
  copyFileSync(join(sourceDir, "Configuration.xml"), join(configurationDir, "Configuration.xml"))
  const languagesDir = join(configurationDir, "Languages")
  mkdirSync(languagesDir)
  for (const name of readdirSync(join(sourceDir, "Languages")).filter((name) => name.endsWith(".xml"))) {
    copyFileSync(join(sourceDir, "Languages", name), join(languagesDir, name))
  }
  const ownerPath = join(configurationDir, params.owner)
  mkdirSync(dirname(ownerPath), { recursive: true })
  copyFileSync(join(sourceDir, params.owner), ownerPath)
  return { configurationDir, ownerPath }
}

function onlyMatchingItems(filePath: string, expected: readonly I8nTextLanguageXML[]): I8nTextLanguageXML[] {
  const matches = matchingItems(filePath, expected)
  if (matches.length !== 1) throw new Error(`Ожидалась одна локализованная строка, найдено ${matches.length}`)
  return matches[0]!
}

function matchingItems(filePath: string, expected: readonly I8nTextLanguageXML[]): I8nTextLanguageXML[][] {
  const parsed = importContentFromXML<unknown>(readFileSync(filePath, "utf8"))
  const result: I8nTextLanguageXML[][] = []
  visit(parsed, (value) => {
    const items = asRecord(value)?.["v8:item"]
    const array = Array.isArray(items) ? items : items === undefined ? [] : [items]
    if (sameItems(array, expected)) result.push(array.map((value) => {
      const record = asRecord(value)!
      return item(String(record["v8:lang"]), String(record["v8:content"]))
    }))
  })
  return result
}

function visit(value: unknown, visitor: (value: unknown) => void): void {
  visitor(value)
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, visitor))
    return
  }
  const record = asRecord(value)
  if (record !== undefined) Object.values(record).forEach((item) => visit(item, visitor))
}

function sameItems(actual: readonly unknown[], expected: readonly I8nTextLanguageXML[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => {
    const record = asRecord(value)
    return record?.["v8:lang"] === expected[index]?.["v8:lang"]
      && record?.["v8:content"] === expected[index]?.["v8:content"]
  })
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function item(language: string, content: string): I8nTextLanguageXML {
  return { "v8:lang": language, "v8:content": content }
}
