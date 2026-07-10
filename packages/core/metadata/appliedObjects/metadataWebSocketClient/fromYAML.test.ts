import { describe, expect, it } from "vitest"
import "../../commonObjects"
import "../../systemEnumerations"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "../../../tests/appliedObject"
import { MetadataWebSocketClientRules } from "./rules"
import type { MetadataWebSocketClient } from "./types"

const fullYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Предопределенный: "Истина",
  АвтоПодключение: "Истина",
  АдресСервера: "url",
  Пользователь: "пользователь",
  Пароль: "пароль",
  Заголовки: [
    { Ключ: "Заголовок 1", Значение: "Значение 1" },
    { Ключ: "Заголовок 1", Значение: "Значение 1 дубль" },
    { Ключ: "Заголовок 2", Значение: "Значение 2" },
  ],
  ИспользоватьПроксиОС: "Истина",
  ИспользоватьАутентификациюОС: "Истина",
  Таймаут: 99,
}

const fullXMLYAML = {
  ...fullYAML,
  Заголовки: [
    { Ключ: "Заголовок 1", Значение: "Значение 1" },
    { Ключ: "Заголовок 2", Значение: "Значение 2" },
  ],
}

describe("import MetadataWebSocketClient from YAML", () => {
  it("imports full fixture", () => {
    const expected = testImportAppliedObjectFromXML<MetadataWebSocketClient>({
      rule: MetadataWebSocketClientRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(testImportAppliedObjectFromYAML({ rule: MetadataWebSocketClientRules, yaml: fullXMLYAML })).toEqual({
      ...expected,
      name: undefined,
    })
  })

  it("round-trips full YAML and preserves duplicate headers", () => {
    const imported = testImportAppliedObjectFromYAML({ rule: MetadataWebSocketClientRules, yaml: fullYAML })
    expect(testExportAppliedObjectToYAML({ rule: MetadataWebSocketClientRules, data: imported })).toEqual(fullYAML)
  })
})
