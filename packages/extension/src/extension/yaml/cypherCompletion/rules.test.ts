import { describe, expect, it } from "vitest"

import { findCypherSetForYamlProperty } from "./rules"

const catalogFormYamlKeys = [
  "ОсновнаяФормаДляВыбора",
  "ОсновнаяФормаДляВыбораГруппы",
  "ОсновнаяФормаГруппы",
  "ОсновнаяФормаСписка",
  "ОсновнаяФормаОбъекта",
  "ДополнительнаяФормаДляВыбора",
  "ДополнительнаяФормаДляВыбораГруппы",
  "ДополнительнаяФормаГруппы",
  "ДополнительнаяФормаСписка",
  "ДополнительнаяФормаОбъекта",
]

describe("findCypherSetForYamlProperty", () => {
  it.each(catalogFormYamlKeys)("returns catalog form Cypher set for %s", (yamlKey) => {
    const set = findCypherSetForYamlProperty("Справочник", yamlKey)

    expect(set).toBeDefined()
    expect(set?.query).toContain("MATCH (scope {id: $scope})-[:FORM]->(form)")
  })

  it("returns undefined for property without Cypher set", () => {
    expect(findCypherSetForYamlProperty("Справочник", "Синоним")).toBeUndefined()
  })

  it("returns undefined for unknown top-level directory", () => {
    expect(findCypherSetForYamlProperty("Неизвестно", "ОсновнаяФормаДляВыбора")).toBeUndefined()
  })
})
