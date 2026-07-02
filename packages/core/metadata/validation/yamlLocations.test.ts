import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { diagnosticAtYamlPath } from "./yamlLocations"

const yaml = [
  "Имя: Тест",
  "Реквизиты:",
  "  - Имя: Первый",
  "    Тип: Строка",
  "  - Имя: Второй",
  "    Тип: Число",
  "Настройки:",
  "  Группа:",
  "    Поле: Значение",
].join("\n")

function diagnosticAt(path: readonly (string | number)[]) {
  return diagnosticAtYamlPath({
    filePath: "/tmp/item.yaml",
    parsed: parseMetadataYaml(yaml),
    path,
    severity: "error",
    source: "structure",
    message: "Сообщение",
  })
}

describe("diagnosticAtYamlPath", () => {
  it("uses the map key position for a map key path", () => {
    expect(diagnosticAt(["Реквизиты"])).toMatchObject({
      filePath: "/tmp/item.yaml",
      line: 2,
      col: 1,
      path: "/Реквизиты",
    })
  })

  it("uses the nested map key position", () => {
    expect(diagnosticAt(["Настройки", "Группа", "Поле"])).toMatchObject({
      line: 9,
      col: 5,
      path: "/Настройки/Группа/Поле",
    })
  })

  it("uses the key position inside a sequence item", () => {
    expect(diagnosticAt(["Реквизиты", 1, "Тип"])).toMatchObject({
      line: 6,
      col: 5,
      path: "/Реквизиты/1/Тип",
    })
  })

  it("falls back to line 1 col 1 when the path is missing", () => {
    expect(diagnosticAt(["Реквизиты", 10, "Тип"])).toMatchObject({
      line: 1,
      col: 1,
      path: "/Реквизиты/10/Тип",
    })
  })

  it("uses the neutral YAML location index when it is present", () => {
    const parsed = parseMetadataYaml(yaml)
    const diagnostic = diagnosticAtYamlPath({
      filePath: "/tmp/item.yaml",
      parsed: {
        ...parsed,
        doc: { contents: undefined } as never,
        lineCounter: { linePos: () => ({ line: 99, col: 99 }) } as never,
      },
      path: ["Настройки", "Группа", "Поле"],
      severity: "error",
      source: "structure",
      message: "Сообщение",
    })

    expect(diagnostic).toMatchObject({
      line: 9,
      col: 5,
      path: "/Настройки/Группа/Поле",
    })
  })
})
