import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../../ruleRuntime/metadataTarget"
import { collectAppliedObjectDataTables } from "../../appliedObjects/dataTableRules"
import { validateProjectStateDataTableReferenceBatch } from "./projectState"
import type { ProjectStatePendingReferenceCheck, ProjectStateQueryPort } from "../../projectState/contracts/dependencyValidation"

describe("project-state data table validation", () => {
  it.each([
    ["РегистрНакопления.Продажи.Обороты", []],
    ["РегистрНакопления.Продажи.Остатки", ['Не найдена ссылка "AccumulationRegister.Продажи.Balance"']],
  ])("validates %s through the registered table declarations", (value, expectedMessages) => {
    const reference = dataTableReference(value)

    const diagnostics = validateProjectStateDataTableReferenceBatch({
      checks: [{ requestId: "table", componentPath: "cf", reference }],
      projectDir: "/project",
      queryPort: accumulationRegisterQueryPort("Turnovers"),
      contributors: [collectAppliedObjectDataTables],
    })

    expect(diagnostics.map(({ message }) => message)).toEqual(expectedMessages)
  })

  it("читает условия виртуальной таблицы из точного файла владельца", () => {
    const sourceProjectPath = "cf/РегистрРасчета/Основной/Свойства.yaml"
    const reference = dataTableReference("РегистрРасчета.Основной.ФактическийПериодДействия")

    const diagnostics = validateProjectStateDataTableReferenceBatch({
      checks: [{ requestId: "table", componentPath: "cf", reference }],
      projectDir: "/project",
      queryPort: {
        resolveTargets: (requests) => requests.map(({ requestId }) => ({
          requestId,
          status: "found" as const,
          target: { kind: "object" as const, canonical: "CalculationRegister.Основной" },
          source: { projectPath: sourceProjectPath, componentPath: "cf" },
        })),
        readDependencyOwnerInputs: (requests) => requests.map((request) =>
          "projectPath" in request && request.projectPath === sourceProjectPath
            ? {
                requestId: request.requestId,
                status: "found" as const,
                input: { owner: request.owner, facts: { actionPeriod: "true" }, fields: [] },
              }
            : { requestId: request.requestId, status: "missing" as const },
        ),
        readOwnerRefPage: () => ({ refs: [] }),
      },
      contributors: [collectAppliedObjectDataTables],
    })

    expect(diagnostics).toEqual([])
  })
})

function dataTableReference(value: string): ProjectStatePendingReferenceCheck["reference"] {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "dataTable" } })
  if (!parsed.ok || parsed.target.kind !== "dataTable") throw new Error("Некорректная тестовая таблица")
  return {
    filePath: "cf/ОбщаяФорма/Список/Форма.yaml",
    yamlPath: ["Реквизиты", "Список", "ДинамическийСписок", "ОсновнаяТаблица"],
    canonical: parsed.canonical,
    target: parsed.target,
    constraint: { kind: "dataTable" },
  }
}

function accumulationRegisterQueryPort(registerType: string): Pick<
  ProjectStateQueryPort,
  "resolveTargets" | "readDependencyOwnerInputs" | "readOwnerRefPage"
> {
  return {
    resolveTargets(requests) {
      return requests.map(({ requestId, canonicalTarget }) => canonicalTarget === "AccumulationRegister.Продажи"
        ? {
            requestId,
            status: "found" as const,
            target: { kind: "object" as const, canonical: canonicalTarget },
            source: { projectPath: "cf/РегистрНакопления/Продажи/Свойства.yaml", componentPath: "cf" },
          }
        : { requestId, status: "missing" as const })
    },
    readDependencyOwnerInputs(requests) {
      return requests.map(({ requestId, owner }) => owner.kind === "РегистрНакопления" && owner.name === "Продажи"
        ? {
            requestId,
            status: "found" as const,
            input: { owner, facts: { registerType }, fields: [] },
          }
        : { requestId, status: "missing" as const })
    },
    readOwnerRefPage() {
      return { refs: [] }
    },
  }
}
