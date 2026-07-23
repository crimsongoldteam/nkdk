import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import type { DeletedScenario, MigrationRow } from "./types"
import { auditMigrationMap } from "./auditMap"

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("auditMigrationMap", () => {
  it("принимает перенесённый и обоснованно устаревший сценарии", () => {
    const repositoryRoot = createRepositoryRoot()
    writeTarget(repositoryRoot, "metadata/fromXMLToYAML.test.ts", 'it("новый сценарий", () => {})')
    const expectedScenarios = [scenario("first"), scenario("second")]
    const rows = [
      row(expectedScenarios[0]!, {
        behavior: "конечное YAML-значение",
        targetPath: "metadata/fromXMLToYAML.test.ts",
        targetTitle: "новый сценарий",
        status: "migrated",
      }),
      row(expectedScenarios[1]!, {
        behavior: "наличие поля старой модели",
        targetPath: "",
        targetTitle: "",
        status: "obsolete-internal",
        justification: "Удалено поле LegacyModel.value без наблюдаемого YAML-представления",
      }),
    ]

    expect(
      auditMigrationMap(rows, { repositoryRoot, expectedScenarios, requireComplete: true })
    ).toEqual([])
  })

  it("сообщает об отсутствующем, лишнем и дублированном id", () => {
    const repositoryRoot = createRepositoryRoot()
    const expectedScenarios = [scenario("first"), scenario("missing")]
    const first = row(expectedScenarios[0]!, { status: "pending" })
    const extra = row(scenario("extra"), { status: "pending" })

    const messages = auditMigrationMap([first, first, extra], {
      repositoryRoot,
      expectedScenarios,
      requireComplete: false,
    }).map(({ message }) => message)

    expect(messages).toEqual(
      expect.arrayContaining([
        "Дублируется id: first",
        "Нет строки для исходного сценария: missing",
        "Лишняя строка без исходного сценария: extra",
      ])
    )
  })

  it("запрещает незавершённые и непроверяемые решения", () => {
    const repositoryRoot = createRepositoryRoot()
    const expectedScenarios = [scenario("pending"), scenario("broken-target"), scenario("obsolete")]
    const rows = [
      row(expectedScenarios[0]!, { status: "pending" }),
      row(expectedScenarios[1]!, {
        status: "migrated",
        behavior: "",
        targetPath: "metadata/missing.test.ts",
        targetTitle: "нет такого теста",
      }),
      row(expectedScenarios[2]!, {
        status: "obsolete-internal",
        behavior: "внутреннее поле",
        justification: "",
      }),
    ]

    const messages = auditMigrationMap(rows, {
      repositoryRoot,
      expectedScenarios,
      requireComplete: true,
    }).map(({ message }) => message)

    expect(messages).toEqual(
      expect.arrayContaining([
        "Сценарий не перенесён: pending",
        "Не описано поведение: broken-target",
        "Целевой тест не существует: metadata/missing.test.ts",
        "Нет обоснования obsolete-internal: obsolete",
      ])
    )
  })

  it("проверяет наличие нового заголовка в целевом файле", () => {
    const repositoryRoot = createRepositoryRoot()
    writeTarget(repositoryRoot, "metadata/fromYAMLToXML.test.ts", 'it("другой сценарий", () => {})')
    const expectedScenarios = [scenario("title")]
    const rows = [
      row(expectedScenarios[0]!, {
        status: "migrated",
        behavior: "конечный XML",
        targetPath: "metadata/fromYAMLToXML.test.ts",
        targetTitle: "ожидаемый сценарий",
      }),
    ]

    expect(
      auditMigrationMap(rows, { repositoryRoot, expectedScenarios, requireComplete: true }).map(
        ({ message }) => message
      )
    ).toContain("В целевом файле нет заголовка: ожидаемый сценарий")
  })
})

function scenario(id: string): DeletedScenario {
  return {
    id,
    deletingCommit: "delete",
    parentCommit: "parent",
    sourcePath: `metadata/${id}/fromXML.test.ts`,
    direction: "fromXML",
    oldTitle: id,
    declarationText: `it("${id}", () => {})`,
    fixtures: [],
    line: 1,
  }
}

function row(scenarioValue: DeletedScenario, overrides: Partial<MigrationRow>): MigrationRow {
  return {
    ...scenarioValue,
    behavior: "",
    targetPath: "",
    targetTitle: "",
    status: "pending",
    ...overrides,
  }
}

function createRepositoryRoot(): string {
  const directory = mkdtempSync(join(tmpdir(), "nkdk-map-audit-"))
  temporaryDirectories.push(directory)
  return directory
}

function writeTarget(repositoryRoot: string, path: string, content: string): void {
  const fullPath = join(repositoryRoot, path)
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, content)
}
