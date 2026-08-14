import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import {
  createConfigurationLanguages,
  importContentFromXML,
  parseMetadataYamlData,
  type ConfigurationLanguages,
} from "@nkdk/runtime"

export async function loadConfigurationLanguagesFromXML(
  xmlDir: string,
): Promise<ConfigurationLanguages> {
  const configurationPath = join(xmlDir, "Configuration.xml")
  const configuration = asRecord(
    asRecord(importContentFromXML<Record<string, unknown>>(
      await readText(configurationPath),
    ).MetaDataObject)?.Configuration,
  )
  const properties = asRecord(configuration?.Properties)
  const childObjects = asRecord(configuration?.ChildObjects)
  const defaultName = languageObjectName(requireString(
    properties?.DefaultLanguage,
    configurationPath,
    "DefaultLanguage",
  ))
  const names = stringList(childObjects?.Language, configurationPath, "ChildObjects/Language")
  assertDefaultObjectExactlyOnce(defaultName, names, configurationPath)

  const codes = await Promise.all(names.map(async (name) => {
    const filePath = join(xmlDir, "Languages", `${name}.xml`)
    const language = asRecord(
      asRecord(importContentFromXML<Record<string, unknown>>(await readText(filePath)).MetaDataObject)?.Language,
    )
    const code = requireString(asRecord(language?.Properties)?.LanguageCode, filePath, "LanguageCode")
    return { name, code, filePath }
  }))
  return buildRegistry(defaultName, codes)
}

export async function loadConfigurationLanguagesFromYAML(
  configurationDir: string,
): Promise<ConfigurationLanguages> {
  const configurationPath = join(configurationDir, "Конфигурация.yaml")
  const configuration = parseYamlRecord(await readText(configurationPath), configurationPath)
  const defaultName = languageObjectName(requireString(
    configuration.ОсновнойЯзык,
    configurationPath,
    "ОсновнойЯзык",
  ))
  const languagesDir = join(configurationDir, "Язык")
  const names = (await readdir(languagesDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
    .map((entry) => entry.name.slice(0, -".yaml".length))
    .sort(compareCodes)
  assertDefaultObjectExactlyOnce(defaultName, names, configurationPath)
  const orderedNames = [defaultName, ...names.filter((name) => name !== defaultName)]

  const codes = await Promise.all(orderedNames.map(async (name) => {
    const filePath = join(languagesDir, `${name}.yaml`)
    const language = parseYamlRecord(await readText(filePath), filePath)
    return {
      name,
      code: requireString(language.КодЯзыка, filePath, "КодЯзыка"),
      filePath,
    }
  }))
  return buildRegistry(defaultName, codes)
}

function buildRegistry(
  defaultName: string,
  languages: readonly { readonly name: string; readonly code: string; readonly filePath: string }[],
): ConfigurationLanguages {
  const seen = new Map<string, string>()
  for (const language of languages) {
    if (language.code.trim() === "") {
      throw new Error(`${language.filePath}: код языка не должен быть пустым`)
    }
    const firstPath = seen.get(language.code)
    if (firstPath !== undefined) {
      throw new Error(`${language.filePath}: код языка ${language.code} уже зарегистрирован в ${firstPath}`)
    }
    seen.set(language.code, language.filePath)
  }
  const defaultCode = languages.find(({ name }) => name === defaultName)?.code
  if (defaultCode === undefined) throw new Error(`Не найден основной объект языка: ${defaultName}`)
  return createConfigurationLanguages({
    default: defaultCode,
    registered: languages.map(({ code }) => code),
  })
}

function assertDefaultObjectExactlyOnce(
  defaultName: string,
  names: readonly string[],
  configurationPath: string,
): void {
  const count = names.filter((name) => name === defaultName).length
  if (count !== 1) {
    throw new Error(`${configurationPath}: основной язык ${defaultName} должен соответствовать ровно одному объекту Language`)
  }
}

async function readText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8")
  } catch (caught) {
    throw new Error(`${filePath}: не удалось прочитать файл`, { cause: caught })
  }
}

function parseYamlRecord(text: string, filePath: string): Record<string, unknown> {
  const parsed = parseMetadataYamlData(text)
  if (parsed.syntaxErrors.length > 0) {
    throw new Error(`${filePath}: ${parsed.syntaxErrors[0]!.message}`)
  }
  const record = asRecord(parsed.data)
  if (record === undefined) throw new Error(`${filePath}: ожидается YAML mapping`)
  return record
}

function languageObjectName(value: string): string {
  return value.replace(/^(?:Language|Язык)\./u, "")
}

function stringList(value: unknown, filePath: string, field: string): string[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values.map((item) => requireString(item, filePath, field))
}

function requireString(value: unknown, filePath: string, field: string): string {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${filePath}: поле ${field} должно быть непустой строкой`)
  }
  return value
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function compareCodes(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
