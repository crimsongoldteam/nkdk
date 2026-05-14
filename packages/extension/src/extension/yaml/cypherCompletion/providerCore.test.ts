import { describe, expect, it, vi } from "vitest"

import { resolveYamlCypherCompletionValues } from "./providerCore"

describe("resolveYamlCypherCompletionValues", () => {
  it("queries graph for top-level YAML property and converts internal ids to YAML references", async () => {
    const runQuery = vi.fn(async () => [
      { value: "Справочник.Товары.Форма.ФормаЭлемента", label: "ФормаЭлемента" },
    ])

    const result = await resolveYamlCypherCompletionValues({
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      text: "ОсновнаяФормаОбъекта: \nСиноним: Товары\n",
      line: 0,
      runQuery,
    })

    expect(runQuery).toHaveBeenCalledWith(
      expect.stringContaining("MATCH (scope {id: $scope})-[:FORM]->(form)"),
      { scope: "Справочник.Товары" },
      { graphName: expect.stringMatching(/^nkdk_[0-9a-f]{12}$/) },
    )
    expect(result).toEqual([
      {
        value: "Catalog.Товары.Form.ФормаЭлемента",
        label: "ФормаЭлемента",
        detail: "Справочник.Товары.Форма.ФормаЭлемента",
      },
    ])
  })

  it("returns an empty list when graph query fails", async () => {
    const result = await resolveYamlCypherCompletionValues({
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      text: "ОсновнаяФормаОбъекта: \n",
      line: 0,
      runQuery: async () => {
        throw new Error("graph is unavailable")
      },
    })

    expect(result).toEqual([])
  })
})
