import { describe, expect, it } from "vitest"

import { topLevelYamlKeyAtLine } from "./yamlKey"

describe("topLevelYamlKeyAtLine", () => {
  it("returns top-level key at line", () => {
    expect(
      topLevelYamlKeyAtLine("Автонумерация: Ложь\nОсновнаяФормаДляВыбора: \n", 1),
    ).toBe("ОсновнаяФормаДляВыбора")
  })

  it("returns undefined for nested key", () => {
    expect(topLevelYamlKeyAtLine("Синоним:\n  en: Test\n", 1)).toBeUndefined()
  })

  it("returns undefined for comment with colon", () => {
    expect(topLevelYamlKeyAtLine("# comment: nope\n", 0)).toBeUndefined()
  })

  it("keeps nested key undefined", () => {
    expect(topLevelYamlKeyAtLine("  nested: nope\n", 0)).toBeUndefined()
  })

  it("trims key before colon", () => {
    expect(topLevelYamlKeyAtLine("ОсновнаяФормаДляВыбора : \n", 0)).toBe(
      "ОсновнаяФормаДляВыбора",
    )
  })
})
