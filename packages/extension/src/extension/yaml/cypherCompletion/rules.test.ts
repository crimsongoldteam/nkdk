import { describe, expect, it } from "vitest"

import { findCypherSetForYamlProperty } from "./rules"

describe("findCypherSetForYamlProperty", () => {
  it("returns catalog form Cypher set by YAML property", () => {
    const set = findCypherSetForYamlProperty("Справочник", "ОсновнаяФормаДляВыбора")

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
