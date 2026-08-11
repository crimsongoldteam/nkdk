import { describe, expect, it } from "vitest"
import { join } from "node:path"
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
        filePath: join("/project/cfe/X/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"),
        severity: "warning",
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

  it("запрещает пустой ПутьКДанным заимствованного элемента", () => {
    const diagnostics = validate([
      working("cf", "ПолеCF"),
      workingWithDataPath("cfe/X", "ПолеCF", "empty"),
    ])

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      path: "/Элементы/ПолеCF/ПутьКДанным",
      message: expect.stringContaining("заимствованного элемента"),
    })])
  })

  it("разрешает пустой ПутьКДанным собственного элемента и явный override заимствованного", () => {
    expect(validate([
      working("cf", "ПолеCF"),
      workingWithDataPath("cfe/X", "ПолеCF", "explicit", "Объект.Поле"),
      workingWithDataPath("cfe/X", "Собственное", "empty"),
    ])).toEqual([])
  })

  it("сообщает об элементе, который остался только в сохранённой основе", () => {
    const diagnostics = validate([
      workingWithDataPath("cfe/X", "Удалённое", "missing"),
      fact("cfe/X", "base", "element", "Удалённое", ["Элементы", "Удалённое"], "БазоваяФорма.yaml"),
    ])

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "warning",
      message: expect.stringContaining("отсутствует в текущей форме cf"),
    })])
  })

  it("запрещает явный вычисляемый путь собственного элемента расширения", () => {
    const diagnostics = validate([
      fact("cfe/X", "working", "mainAttribute", "Объект", ["Реквизиты", "Объект", "ОсновнойРеквизит"]),
      workingWithDataPath("cfe/X", "Код", "explicit", "Объект.Код"),
    ])

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      path: "/Элементы/Код/ПутьКДанным",
      message: expect.stringContaining("не нужно указывать явно"),
    })])
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
        filePath: join("/project/cfe/X/БазоваяФорма.yaml"),
        severity: "warning",
        path: `/${dottedPath.replaceAll(".", "/")}`,
        message: expect.stringContaining(name),
      }),
    ])
  })

  it("проверяет корень ПутьКДанным только по реквизитам основы", () => {
    const diagnostics = validate([
      fact("cfe/X", "working", "attribute", "РеквизитРабочейФормы", ["Реквизиты", "РеквизитРабочейФормы"]),
      fact("cfe/X", "working", "attribute", "РеквизитОсновы", ["Реквизиты", "РеквизитОсновы"]),
      fact("cfe/X", "base", "attribute", "РеквизитОсновы", ["Реквизиты", "РеквизитОсновы"], "БазоваяФорма.yaml"),
      fact("cfe/X", "base", "dataPath", "РеквизитРабочейФормы.Код", ["Элементы", "Поле", "ПутьКДанным"], "БазоваяФорма.yaml"),
    ])

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join("/project/cfe/X/БазоваяФорма.yaml"),
        severity: "error",
        path: "/Элементы/Поле/ПутьКДанным",
        message: expect.stringContaining("РеквизитРабочейФормы"),
      }),
    ])
  })
})

function validate(facts: readonly ProjectStateStructuredDocumentFact[]) {
  const params: ProjectStateStructuredDocumentValidationParams = {
    projectDir: "/project",
    facts,
    queryPort: {
      readDependencyInputs(requests) {
        return requests.map(({ requestId }) => ({
          requestId,
          status: "found" as const,
          input: {
            owners: [{ owner: { kind: "Справочник", name: "Товары" }, facts: {} }],
            fields: [{
              owner: { kind: "Справочник", name: "Товары" },
              name: "Код",
              kind: "standardAttribute" as const,
              targetName: "Code",
              typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
            }],
            forms: [{
              kind: "root" as const,
              owner: { kind: "Справочник", name: "Товары" },
              name: "Объект",
              source: {
                kind: "formAttribute" as const,
                name: "Объект",
                typeInfo: {
                  kinds: ["object"],
                  nextTypes: [{ kind: "Справочник", name: "Товары" }],
                  sourceText: "СправочникОбъект.Товары",
                },
              },
            }],
          },
        }))
      },
      readDependencyOwnerInputs(requests) {
        return requests.map(({ requestId }) => ({ requestId, status: "missing" as const }))
      },
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

function workingWithDataPath(
  componentPath: string,
  name: string,
  primaryDataPath: "missing" | "empty" | "explicit",
  value?: string,
): ProjectStateStructuredDocumentFact {
  const result = working(componentPath, name)
  return {
    ...result,
    entry: {
      ...result.entry,
      payload: JSON.stringify({
        version: 1,
        primaryDataPath,
        ...(value === undefined ? {} : { value }),
        owner: { kind: "Справочник", name: "Товары" },
      }),
    },
  }
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
