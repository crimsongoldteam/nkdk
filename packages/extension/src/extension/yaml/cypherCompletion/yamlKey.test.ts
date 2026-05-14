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
})
