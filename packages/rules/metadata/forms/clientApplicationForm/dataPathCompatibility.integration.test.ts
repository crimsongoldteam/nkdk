import { beforeAll, describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import { resolveValidationProjectFile } from "../../validation/projectFiles"
import { validatePendingChecks } from "../../validation/projectValidationPendingChecks"
import { extractValidationYamlFacts } from "../../validation/yamlFactExtractor"
import {
  createTestValidationRulesSnapshot,
  missingOwnerMetadataCache,
} from "../../validation/tests/validationTestSupport"


let rulesSnapshot: ReturnType<typeof createTestValidationRulesSnapshot>
beforeAll(() => {
  rulesSnapshot = createTestValidationRulesSnapshot()
})

const cases = [
  ["ПолеВвода", "[Строка, Булево]", true],
  ["ПолеНадписи", "[Число, Картинка]", true],
  ["ПолеФлажок", "Булево", true],
  ["ПолеФлажок", "Число", true],
  ["ПолеФлажок", "Строка", false],
  ["ПолеФлажок", "Дата", false],
  ["ПолеФлажок", "Перечисление.Состояния", false],
  ["ПолеРисунка", "Картинка", true],
  ["ПолеРисунка", "Строка", true],
  ["ПолеРисунка", "Число", true],
  ["ПолеРисунка", "Булево", true],
  ["ПолеРисунка", "Перечисление.Состояния", true],
  ["ПолеРисунка", "ХранилищеЗначения", true],
  ["ПолеРисунка", "[Картинка, Строка]", false],
  ["ТаблицаФормы", "CalculationRegisterRecordSet.Начисления", true],
  ["ТаблицаФормы", "ChartOfAccountsTabularSection.Хозрасчетный.ВидыСубконто", true],
  ["ПолеТабличногоДокумента", "ТабличныйДокумент", true],
  ["ПолеТабличногоДокумента", "Строка", false],
  ["ПолеHTMLДокумента", "Строка", true],
  ["ПолеHTMLДокумента", "Число", false],
  ["ПолеТекстовогоДокумента", "ТекстовыйДокумент", true],
  ["ПолеТекстовогоДокумента", "Число", false],
  ["ПолеИндикатора", "Число", true],
  ["ПолеИндикатора", "Строка", false],
  ["ПолеПолосыПрокрутки", "Число", true],
  ["ПолеПолосыПрокрутки", "Строка", false],
  ["ПолеФорматированногоДокумента", "ФорматированныйДокумент", true],
  ["ПолеФорматированногоДокумента", "Строка", false],
  ["ПолеДиаграммы", "Диаграмма", true],
  ["ПолеДиаграммы", "Строка", false],
  ["ПолеКалендаря", "Дата", true],
  ["ПолеКалендаря", "Строка", false],
  ["ПолеГрафическойСхемы", "ГрафическаяСхема", true],
  ["ПолеГрафическойСхемы", "Строка", false],
  ["ПолеPDFДокумента", "ДокументPDF", true],
  ["ПолеPDFДокумента", "Строка", false],
  ["ПолеДиаграммыГанта", "ДиаграммаГанта", true],
  ["ПолеДиаграммыГанта", "Строка", false],
  ["ПолеПланировщика", "Планировщик", true],
  ["ПолеПланировщика", "Строка", false],
  ["ПолеГеографическойСхемы", "ГеографическаяСхема", true],
  ["ПолеГеографическойСхемы", "Строка", false],
] as const

describe("совместимость ПутьКДанным в полной форме", () => {
  it.each(cases)("%s и %s: совместимость=%s", (elementKind, attributeType, compatible) => {
    const diagnostics = validate(elementKind, attributeType)

    if (compatible) {
      expect(diagnostics).toEqual([])
      return
    }
    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Элементы/Поле/ПутьКДанным",
        severity: "error",
        source: "structure",
        message: expect.stringContaining("элемент"),
      }),
    ])
    expect(diagnostics[0]?.message).toContain("Значение")
    expect(diagnostics[0]?.message).toContain("ожидается")
  })

  it.each([
    [false, false],
    [true, true],
  ] as const)("разрешает ТаблицаЗначений для картинки только при КартинкаЗначений=%s", (hasPicture, compatible) => {
    const diagnostics = validate("ПолеРисунка", "ТаблицаЗначений", hasPicture)
    expect(diagnostics).toHaveLength(compatible ? 0 : 1)
  })

  it.each([
    ["Кнопка", "Данные"],
    ["ПолеДендрограммы", "ПутьКДанным"],
    ["ПолеПериода", "ПутьКДанным"],
  ] as const)("не применяет закрытую матрицу к %s", (elementKind, dataPathKey) => {
    expect(validate(elementKind, "Строка", false, dataPathKey)).toEqual([])
  })

  it("проверяет дополнительный путь таблицы только на существование", () => {
    const diagnostics = validate("ТаблицаФормы", "Строка", false, "ПутьКДаннымКартинкиСтроки")
    expect(diagnostics).toEqual([])
  })

  it.each([
    ["ПолеИндикатора", true],
    ["ПолеHTMLДокумента", false],
  ] as const)("учитывает числовой тип виртуальной колонки RowsCount для %s", (elementKind, compatible) => {
    const diagnostics = validateVirtualColumn(elementKind, "RowsCount")
    expect(diagnostics).toHaveLength(compatible ? 0 : 1)
    if (!compatible) expect(diagnostics[0]?.message).toContain("decimal")
  })

  it.each([
    ["ТаблицаФормы", "ЭлементПараметрыДанных", true],
    ["ПолеВвода", "ЭлементПараметрыДанных", false],
    ["ТаблицаФормы", "ЭлементОтбор", true],
    ["ПолеВвода", "ЭлементОтбор", true],
    ["ПолеНадписи", "ЭлементОтбор", true],
    ["ПолеПереключателя", "ЭлементОтбор", false],
    ["ПолеВвода", "ЭлементПоляГруппировки.Поле", true],
    ["ПолеНадписи", "ЭлементПоляГруппировки.Поле", true],
    ["ПолеПереключателя", "ЭлементПоляГруппировки.Поле", false],
    ["ПолеПереключателя", "ЭлементОтбор.ВидСравнения", true],
    ["ПолеПереключателя", "ЭлементОтбор.ТипГруппы", true],
    ["ПолеПереключателя", "ЭлементОтбор.Применение", true],
    ["ПолеПереключателя", "ЭлементВыбор.Расположение", true],
    ["ПолеПереключателя", "ЭлементПоляГруппировки.ТипДополнения", true],
    ["ПолеПереключателя", "ЭлементПорядок.ТипУпорядочивания", true],
  ] as const)("проверяет %s для SettingsComposer.%s: совместимость=%s", (elementKind, path, compatible) => {
    const diagnostics = validateSettingsComposer(elementKind, path)

    expect(diagnostics).toHaveLength(compatible ? 0 : 1)
    if (!compatible) expect(diagnostics[0]?.message).toContain("ожидается")
  })
})

function validateSettingsComposer(elementKind: string, path: string) {
  const projectDir = "/project"
  const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file === undefined) throw new Error("Не удалось определить файл формы")
  const parsed = parseMetadataYaml([
    "Реквизиты:",
    "  КомпоновщикНастроек:",
    "    Тип: КомпоновщикНастроекКомпоновкиДанных",
    "Элементы:",
    "  Поле:",
    `    Вид: ${elementKind}`,
    `    ПутьКДанным: КомпоновщикНастроек.Настройки.${path}`,
  ].join("\n"))
  const facts = extractValidationYamlFacts({ file, parsed, rulesSnapshot })
  return validatePendingChecks({ ownerCache: missingOwnerMetadataCache, checks: facts.pendingChecks }).diagnostics
}

function validate(
  elementKind: string,
  attributeType: string,
  hasValuesPicture = false,
  dataPathKey = "ПутьКДанным",
) {
  const projectDir = "/project"
  const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file === undefined) throw new Error("Не удалось определить файл формы")
  const parsed = parseMetadataYaml([
    "Реквизиты:",
    "  Значение:",
    `    Тип: ${attributeType}`,
    "Элементы:",
    "  Поле:",
    `    Вид: ${elementKind}`,
    ...(hasValuesPicture ? ["    КартинкаЗначений: ОбщаяКартинка.Состояния"] : []),
    `    ${dataPathKey}: Значение`,
  ].join("\n"))
  const facts = extractValidationYamlFacts({
    file,
    parsed,
    rulesSnapshot,
  })
  return validatePendingChecks({ ownerCache: missingOwnerMetadataCache, checks: facts.pendingChecks }).diagnostics
}

function validateVirtualColumn(elementKind: string, column: string) {
  const projectDir = "/project"
  const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file === undefined) throw new Error("Не удалось определить файл формы")
  const parsed = parseMetadataYaml([
    "Реквизиты:",
    "  Таблица:",
    "    Тип: ТаблицаЗначений",
    "Элементы:",
    "  Поле:",
    `    Вид: ${elementKind}`,
    `    ПутьКДанным: Таблица.${column}`,
  ].join("\n"))
  const facts = extractValidationYamlFacts({
    file,
    parsed,
    rulesSnapshot,
  })
  return validatePendingChecks({ ownerCache: missingOwnerMetadataCache, checks: facts.pendingChecks }).diagnostics
}
