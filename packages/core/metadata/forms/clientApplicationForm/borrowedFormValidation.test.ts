import { describe, expect, it } from "vitest"
import type {
  ProjectStateStructuredDocumentFact,
  ProjectStateStructuredDocumentValidationParams,
} from "../../projectState/contracts/dependencyValidation"
import { validateBorrowedClientApplicationForms } from "./borrowedFormValidation"

const address = "Справочник.Товары.Форма.ФормаЭлемента"

describe("проверка заимствованной формы", () => {
  it("требует в рабочей форме расширения все элементы текущей cf", () => {
    const diagnostics = validate([working("cf", "ПолеCF"), working("cfe/X", "Собственное")])

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: "/project/cfe/X/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        message: expect.stringContaining("ПолеCF"),
      }),
    ])
  })

  it("проверяет даже пустую рабочую форму расширения", () => {
    const diagnostics = validate([
      working("cf", "ПолеCF"),
      fact("cfe/X", "working", "document", "", []),
    ])

    expect(diagnostics).toEqual([expect.objectContaining({ message: expect.stringContaining("ПолеCF") })])
  })

  it("разрешает собственные элементы расширения", () => {
    expect(validate([
      working("cf", "ПолеCF"),
      working("cfe/X", "ПолеCF"),
      working("cfe/X", "Собственное"),
    ])).toEqual([])
  })

  it.each([
    ["element", "Элементы.Поля"],
    ["attribute", "Реквизиты.Объект"],
    ["command", "Команды.Записать"],
    ["parameter", "Параметры.Режим"],
  ])("проверяет компонент основы %s по её пути", (componentKind, dottedPath) => {
    const name = dottedPath.split(".").at(-1)!
    const base = fact("cfe/X", "base", componentKind, name, dottedPath.split("."), "БазоваяФорма.yaml")
    const diagnostics = validate([base])

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: "/project/cfe/X/БазоваяФорма.yaml",
        path: `/${dottedPath.replaceAll(".", "/")}`,
        message: expect.stringContaining(name),
      }),
    ])
  })
})

function validate(facts: readonly ProjectStateStructuredDocumentFact[]) {
  const params: ProjectStateStructuredDocumentValidationParams = {
    projectDir: "/project",
    facts,
    queryPort: {
      readStructuredDocumentEntries({ componentPath, logicalAddress }) {
        return facts
          .filter((fact) => fact.componentPath === componentPath && fact.entry.logicalAddress === logicalAddress)
          .map(({ entry }) => entry)
      },
    },
  }
  return validateBorrowedClientApplicationForms(params)
}

function working(componentPath: string, name: string): ProjectStateStructuredDocumentFact {
  return fact(componentPath, "working", "element", name, ["Элементы", name])
}

function fact(
  componentPath: string,
  representation: "working" | "base",
  componentKind: string,
  name: string,
  yamlPath: readonly string[],
  fileName = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
): ProjectStateStructuredDocumentFact {
  return {
    componentPath,
    projectPath: `${componentPath}/${fileName}`,
    entry: {
      documentKind: "clientApplicationForm",
      representation,
      logicalAddress: address,
      workingProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      componentKind,
      name,
      yamlPath,
    },
  }
}
