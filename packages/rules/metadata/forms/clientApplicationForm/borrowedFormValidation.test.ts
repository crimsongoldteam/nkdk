import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
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
        filePath: "cfe/X/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
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

  it("требует явно добавить унаследованный корень нового DataPath", () => {
    const diagnostics = validate([
      fact("cf", "working", "attribute", "Контрагент", ["Реквизиты", "Контрагент"]),
      explicitDataPath("cfe/X", "Контрагент.ИНН", ["Элементы", "ИНН", "ПутьКДанным"]),
    ])

    expect(diagnostics).toContainEqual(expect.objectContaining({
      severity: "error",
      source: "cross-file",
      path: "/Элементы/ИНН/ПутьКДанным",
      message: "Путь «Контрагент.ИНН» использует реквизит формы «Контрагент», который не добавлен в «Реквизиты» заимствованной формы",
    }))
  })

  it("разрешает DataPath через явно добавленный working-реквизит", () => {
    expect(validate([
      fact("cf", "working", "attribute", "Контрагент", ["Реквизиты", "Контрагент"]),
      fact("cfe/X", "working", "attribute", "Контрагент", ["Реквизиты", "Контрагент"]),
      explicitDataPath("cfe/X", "Контрагент.Код", ["Элементы", "Код", "ПутьКДанным"]),
    ])).toEqual([])
  })

  it("сообщает только о первом недоступном metadata-сегменте", () => {
    const diagnostics = validate([
      fact("cf", "working", "attribute", "Контрагент", ["Реквизиты", "Контрагент"]),
      fact("cfe/X", "working", "attribute", "Контрагент", ["Реквизиты", "Контрагент"]),
      explicitDataPath("cfe/X", "Контрагент.ИНН", ["Элементы", "ИНН", "ПутьКДанным"]),
    ])

    expect(diagnostics).toEqual([expect.objectContaining({
      path: "/Элементы/ИНН/ПутьКДанным",
      message: "Путь «Контрагент.ИНН» обращается к реквизиту «ИНН», который недоступен в компоненте расширения",
    })])
  })

  it("требует working-корень для вычисляемого пути собственного элемента", () => {
    const diagnostics = validate([
      fact("cf", "working", "attribute", "Объект", ["Реквизиты", "Объект"]),
      fact("cf", "working", "mainAttribute", "Объект", ["Реквизиты", "Объект", "ОсновнойРеквизит"]),
      workingWithDataPath("cfe/X", "ДатаАктуальности", "missing"),
    ])

    expect(diagnostics).toContainEqual(expect.objectContaining({
      path: "/Элементы/ДатаАктуальности/ПутьКДанным",
      message: "Путь «Объект.ДатаАктуальности» использует реквизит формы «Объект», который не добавлен в «Реквизиты» заимствованной формы",
    }))
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

  it("разрешает явный вычисляемый путь владельца без уплотнения", () => {
    expect(validate([
      fact("cfe/X", "working", "mainAttribute", "Объект", ["Реквизиты", "Объект", "ОсновнойРеквизит"]),
      workingWithDataPath(
        "cfe/X",
        "Код",
        "explicit",
        "Объект.Код",
        { kind: "ВнешнийИсточникДанных", name: "Источник" },
      ),
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
        filePath: "cfe/X/БазоваяФорма.yaml",
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
        filePath: "cfe/X/БазоваяФорма.yaml",
        severity: "error",
        path: "/Элементы/Поле/ПутьКДанным",
        message: expect.stringContaining("РеквизитРабочейФормы"),
      }),
    ])
  })

  it("запрещает полностью восстановимую сохранённую основу", () => {
    const current = {
      События: { ПриОткрытии: "Обработка" },
      Элементы: { Поле: { Вид: "ПолеВвода" } },
    }
    const diagnostics = validate([
      semanticDocument("cf", "working", current),
      semanticDocument("cfe/X", "working", current),
      semanticDocument("cfe/X", "base", {
        Элементы: { Поле: { Вид: "ПолеВвода" } },
        События: { ПриОткрытии: "Обработка" },
      }, "БазоваяФорма.yaml"),
    ])

    expect(diagnostics).toContainEqual(expect.objectContaining({
      severity: "error",
      filePath: "cfe/X/БазоваяФорма.yaml",
      path: "/",
      message: "БазоваяФорма.yaml избыточна: основа полностью восстанавливается из основной конфигурации и рабочей формы расширения",
    }))
  })

  it("разрешает значимо отличающуюся сохранённую основу", () => {
    expect(validate([
      semanticDocument("cf", "working", { Ширина: 20 }),
      semanticDocument("cfe/X", "working", { Ширина: 20 }),
      semanticDocument("cfe/X", "base", { Ширина: 99 }, "БазоваяФорма.yaml"),
    ])).toEqual([])
  })

  it.each(["cf", "working", "base"] as const)(
    "не предполагает избыточность без payload %s",
    (missing) => {
      const current = { Ширина: 20 }
      const facts = [
        semanticDocument("cf", "working", current, undefined, address, missing === "cf"),
        semanticDocument("cfe/X", "working", current, undefined, address, missing === "working"),
        semanticDocument("cfe/X", "base", current, "БазоваяФорма.yaml", address, missing === "base"),
      ]
      expect(validate(facts)).toEqual([])
    },
  )

  it("проверяет избыточность основы общей формы по topology-адресу", () => {
    const commonAddress = "ОбщаяФорма.РабочийСтол"
    const current = { Ширина: 20 }
    const diagnostics = validate([
      semanticDocument("cf", "working", current, "ОбщаяФорма/РабочийСтол/Свойства.yaml", commonAddress),
      semanticDocument("cfe/X", "working", current, "ОбщаяФорма/РабочийСтол/Свойства.yaml", commonAddress),
      semanticDocument("cfe/X", "base", current, "ОбщаяФорма/РабочийСтол/БазоваяФорма.yaml", commonAddress),
    ])

    expect(diagnostics).toContainEqual(expect.objectContaining({
      filePath: "cfe/X/ОбщаяФорма/РабочийСтол/БазоваяФорма.yaml",
      severity: "error",
    }))
  })
})

function validate(facts: readonly ProjectStateStructuredDocumentFact[]) {
  const params: ProjectStateStructuredDocumentValidationParams = {
    projectDir: "/project",
    facts,
    queryPort: {
      readDependencyInputs(requests) {
        return requests.map(({ requestId, check }) => {
          if (check.kind !== "dataPath") throw new Error(`Ожидалась проверка DataPath, получена ${check.kind}`)
          const rootOwner = check.owner
          const targetOwner = rootOwner.kind === "ВнешнийИсточникДанных"
            ? { kind: "ВнешнийИсточникДанныхТаблица", name: `${rootOwner.name}.Таблица` }
            : rootOwner
          const rootName = check.value.split(".")[0]?.replace(/\[\d+\]$/, "") ?? ""
          return {
            requestId,
            status: "found" as const,
            input: {
              owners: [
                { owner: rootOwner, facts: {} },
                ...(targetOwner.kind === rootOwner.kind ? [] : [{ owner: targetOwner, facts: {} }]),
              ],
              fields: [{
                owner: targetOwner,
                name: "Код",
                kind: "standardAttribute" as const,
                targetName: "Code",
                typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
              }],
              forms: [{
                kind: "root" as const,
                owner: rootOwner,
                name: rootName,
                source: {
                  kind: "formAttribute" as const,
                  name: rootName,
                  typeInfo: {
                    kinds: ["object"],
                    nextTypes: [targetOwner],
                    sourceText: "Объект",
                  },
                },
              }],
            },
          }
        })
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
  owner: { readonly kind: string; readonly name: string } = { kind: "Справочник", name: "Товары" },
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
        owner,
      }),
    },
  }
}

function explicitDataPath(
  componentPath: string,
  value: string,
  yamlPath: readonly string[],
): ProjectStateStructuredDocumentFact {
  const result = fact(componentPath, "working", "dataPath", value, yamlPath)
  return {
    ...result,
    entry: {
      ...result.entry,
      payload: JSON.stringify({
        version: 1,
        mode: "explicit",
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
  logicalAddress = address,
): ProjectStateStructuredDocumentFact {
  return {
    componentPath,
    projectPath: `${componentPath}/${fileName}`,
    entry: {
      documentKind: "clientApplicationForm",
      representation,
      logicalAddress,
      workingProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      componentKind,
      name,
      yamlPath,
    },
  }
}

function semanticDocument(
  componentPath: string,
  representation: "working" | "base",
  yaml: object,
  fileName = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
  logicalAddress = address,
  withoutPayload = false,
): ProjectStateStructuredDocumentFact {
  const result = fact(componentPath, representation, "document", "", [], fileName, logicalAddress)
  return withoutPayload
    ? result
    : {
        ...result,
        entry: {
          ...result.entry,
          payload: JSON.stringify({ version: 1, yaml }),
        },
      }
}
