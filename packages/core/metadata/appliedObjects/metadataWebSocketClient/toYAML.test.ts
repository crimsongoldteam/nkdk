import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects"
import "~/metadata/systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataWebSocketClientRules } from "./rules"
import type { MetadataWebSocketClient } from "./types"

const cases = [
  {
    fixture: "minimal.xml",
    yaml: {},
  },
  {
    fixture: "full.xml",
    yaml: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Предопределенный: "Истина",
      АвтоПодключение: "Истина",
      АдресСервера: "url",
      Пользователь: "пользователь",
      Пароль: "пароль",
      Заголовки: [
        { Ключ: "Заголовок 1", Значение: "Значение 1" },
        { Ключ: "Заголовок 2", Значение: "Значение 2" },
      ],
      ИспользоватьПроксиОС: "Истина",
      ИспользоватьАутентификациюОС: "Истина",
      Таймаут: 99,
    },
  },
] as const

describe("export MetadataWebSocketClient to YAML", () => {
  it.each(cases)("exports $fixture", ({ fixture, yaml }) => {
    const data = testImportAppliedObjectFromXML<MetadataWebSocketClient>({
      rule: MetadataWebSocketClientRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(testExportAppliedObjectToYAML({ rule: MetadataWebSocketClientRules, data })).toEqual(yaml)
  })
})
