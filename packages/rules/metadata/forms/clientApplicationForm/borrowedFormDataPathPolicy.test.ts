import { describe, expect, it } from "vitest"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import {
  collectBorrowedFormDataPathChecks,
  missingBorrowedFormRootDiagnostics,
} from "./borrowedFormDataPathPolicy"

describe("политика путей заимствованной формы", () => {
  it("собирает явные DataPath и не дублирует одинаковую YAML-границу", () => {
    const path = entry("dataPath", "Контрагент.ИНН", ["Элементы", "ИНН", "ПутьКДанным"], {
      version: 1,
      mode: "explicit",
      owner: { kind: "Справочник", name: "Товары" },
    })

    expect(collectBorrowedFormDataPathChecks({
      workingEntries: [path, path],
      currentEntries: [],
    })).toEqual([{
      value: "Контрагент.ИНН",
      yamlPath: ["Элементы", "ИНН", "ПутьКДанным"],
      owner: { kind: "Справочник", name: "Товары" },
      mode: "explicit",
    }])
  })

  it("вычисляет путь собственного элемента через основной реквизит cf", () => {
    const checks = collectBorrowedFormDataPathChecks({
      workingEntries: [
        entry("element", "ДатаАктуальности", ["Элементы", "ДатаАктуальности"], {
          version: 1,
          primaryDataPath: "missing",
          owner: { kind: "Справочник", name: "Виджеты" },
        }),
      ],
      currentEntries: [
        entry("mainAttribute", "Объект", ["Реквизиты", "Объект", "ОсновнойРеквизит"]),
      ],
    })

    expect(checks).toEqual([{
      value: "Объект.ДатаАктуальности",
      yamlPath: ["Элементы", "ДатаАктуальности", "ПутьКДанным"],
      owner: { kind: "Справочник", name: "Виджеты" },
      mode: "implicit-own",
    }])
  })

  it("не проверяет неявный путь неизменённого элемента cf", () => {
    expect(collectBorrowedFormDataPathChecks({
      workingEntries: [entry("element", "Код", ["Элементы", "Код"], {
        version: 1,
        primaryDataPath: "missing",
        owner: { kind: "Справочник", name: "Товары" },
      })],
      currentEntries: [
        entry("element", "Код", ["Элементы", "Код"]),
        entry("mainAttribute", "Объект", ["Реквизиты", "Объект", "ОсновнойРеквизит"]),
      ],
    })).toEqual([])
  })

  it.each(["Объект", "Контрагент", "Таблица[4]"])(
    "требует working-реквизит для пути через %s",
    (root) => {
      const value = `${root}.Поле`
      const diagnostics = missingBorrowedFormRootDiagnostics({
        checks: [{
          value,
          yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
          owner: { kind: "Справочник", name: "Товары" },
          mode: "explicit",
        }],
        workingEntries: [],
        currentEntries: [entry("attribute", root.replace(/\[\d+\]$/, ""), ["Реквизиты", root])],
        filePath: "/project/cfe/X/Форма.yaml",
      })

      const semanticRoot = root.replace(/\[\d+\]$/, "")
      expect(diagnostics).toEqual([expect.objectContaining({
        severity: "error",
        source: "cross-file",
        path: "/Элементы/Поле/ПутьКДанным",
        message: `Путь «${value}» использует реквизит формы «${semanticRoot}», который не добавлен в «Реквизиты» заимствованной формы`,
      })])
    },
  )

  it("разрешает собственный working-реквизит и служебные корни", () => {
    const checks = ["Собственный.Код", "Элементы.Таблица.ТекущиеДанные.Код"].map((value) => ({
      value,
      yamlPath: ["Элементы", "Поле", value],
      owner: { kind: "Справочник", name: "Товары" },
      mode: "explicit" as const,
    }))

    expect(missingBorrowedFormRootDiagnostics({
      checks,
      workingEntries: [entry("attribute", "Собственный", ["Реквизиты", "Собственный"])],
      currentEntries: [],
      filePath: "/project/cfe/X/Форма.yaml",
    })).toEqual([])
  })
})

function entry(
  componentKind: string,
  name: string,
  yamlPath: readonly (string | number)[],
  payload?: object,
): ProjectStateStructuredDocumentEntry {
  return {
    documentKind: "clientApplicationForm",
    representation: "working",
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    workingProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    componentKind,
    name,
    yamlPath,
    ...(payload === undefined ? {} : { payload: JSON.stringify(payload) }),
  }
}
