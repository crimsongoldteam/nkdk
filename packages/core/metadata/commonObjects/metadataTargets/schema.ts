import { Type, type TSchema } from "@sinclair/typebox"
import { fieldKindToYAML, METADATA_NAME_PATTERN, rootToYAML } from "./roots"
import type { MetadataFieldKind, MetadataRootName, MetadataTargetConstraint } from "./types"

type MetadataPrimitiveType = NonNullable<Extract<MetadataTargetConstraint, { kind: "type" }>["primitives"]>[number]

const noMatchPattern = "^(?!)$"
const emptyRefYAML = "ПустаяСсылка"

const allFieldKinds = Object.keys(fieldKindToYAML) as MetadataFieldKind[]
const allRoots = Object.keys(rootToYAML) as MetadataRootName[]
const allPrimitiveTypes: readonly MetadataPrimitiveType[] = ["string", "decimal", "dateTime", "boolean", "ValueStorage"]

const objectExampleByRoot: Partial<Record<MetadataRootName, string>> = {
  Catalog: "Справочник.ИмяСправочника",
  Document: "Документ.ИмяДокумента",
  Enum: "Перечисление.ИмяПеречисления",
  InformationRegister: "РегистрСведений.ИмяРегистраСведений",
  AccumulationRegister: "РегистрНакопления.ИмяРегистраНакопления",
  AccountingRegister: "РегистрБухгалтерии.ИмяРегистраБухгалтерии",
  CalculationRegister: "РегистрРасчета.ИмяРегистраРасчета",
  ExchangePlan: "ПланОбмена.ИмяПланаОбмена",
  ChartOfAccounts: "ПланСчетов.ИмяПланаСчетов",
  ChartOfCharacteristicTypes: "ПланВидовХарактеристик.ИмяПланаВидовХарактеристик",
  ChartOfCalculationTypes: "ПланВидовРасчета.ИмяПланаВидовРасчета",
  BusinessProcess: "БизнесПроцесс.ИмяБизнесПроцесса",
  BusinessProcessRoutePoint: "ТочкаМаршрутаБизнесПроцесса.ИмяТочкиМаршрута",
  Task: "Задача.ИмяЗадачи",
  DataProcessor: "Обработка.ИмяОбработки",
  Report: "Отчет.ИмяОтчета",
  CommonPicture: "ОбщаяКартинка.ИмяОбщейКартинки",
  StyleItem: "ЭлементСтиля.ИмяЭлементаСтиля",
}

const typeRefExampleByRoot: Partial<Record<MetadataRootName, string>> = {
  Catalog: "Справочник.ИмяСправочника",
  Document: "Документ.ИмяДокумента",
  Enum: "Перечисление.ИмяПеречисления",
  InformationRegister: "РегистрСведений.ИмяРегистраСведений",
  AccumulationRegister: "РегистрНакопления.ИмяРегистраНакопления",
  AccountingRegister: "РегистрБухгалтерии.ИмяРегистраБухгалтерии",
  CalculationRegister: "РегистрРасчета.ИмяРегистраРасчета",
  ExchangePlan: "ПланОбмена.ИмяПланаОбмена",
  ChartOfAccounts: "ПланСчетов.ИмяПланаСчетов",
  ChartOfCharacteristicTypes: "ПланВидовХарактеристик.ИмяПланаВидовХарактеристик",
  ChartOfCalculationTypes: "ПланВидовРасчета.ИмяПланаВидовРасчета",
  BusinessProcess: "БизнесПроцесс.ИмяБизнесПроцесса",
  BusinessProcessRoutePoint: "ТочкаМаршрутаБизнесПроцесса.ИмяТочкиМаршрута",
  Task: "Задача.ИмяЗадачи",
  DataProcessor: "Обработка.ИмяОбработки",
  Report: "Отчет.ИмяОтчета",
  CommonPicture: "ОбщаяКартинка.ИмяОбщейКартинки",
  StyleItem: "ЭлементСтиля.ИмяЭлементаСтиля",
}

const fieldObjectNameByRoot: Partial<Record<MetadataRootName, string>> = {
  Catalog: "ИмяСправочника",
  Document: "ИмяДокумента",
  Enum: "ИмяПеречисления",
  InformationRegister: "ИмяРегистраСведений",
  AccumulationRegister: "ИмяРегистраНакопления",
  AccountingRegister: "ИмяРегистраБухгалтерии",
  CalculationRegister: "ИмяРегистраРасчета",
  ExchangePlan: "ИмяПланаОбмена",
  ChartOfAccounts: "ИмяПланаСчетов",
  ChartOfCharacteristicTypes: "ИмяПланаВидовХарактеристик",
  ChartOfCalculationTypes: "ИмяПланаВидовРасчета",
  BusinessProcess: "ИмяБизнесПроцесса",
  BusinessProcessRoutePoint: "ИмяТочкиМаршрута",
  Task: "ИмяЗадачи",
  DataProcessor: "ИмяОбработки",
  Report: "ИмяОтчета",
  CommonPicture: "ИмяОбщейКартинки",
  StyleItem: "ИмяЭлементаСтиля",
}

const primitiveTypePatterns = {
  string: "Строка(?:\\([1-9][0-9]*\\))?|ФиксированнаяСтрока\\([1-9][0-9]*\\)",
  decimal: "Число(?:\\([1-9][0-9]*(?:\\s*,\\s*[0-9]+)?\\))?|ПоложительноеЧисло(?:\\([1-9][0-9]*(?:\\s*,\\s*[0-9]+)?\\))?",
  dateTime: "Дата|Время|ДатаВремя",
  boolean: "Булево",
  ValueStorage: "ХранилищеЗначения",
} as const satisfies Record<MetadataPrimitiveType, string>

const primitiveTypeExamples = {
  string: "Строка",
  decimal: "Число",
  dateTime: "ДатаВремя",
  boolean: "Булево",
  ValueStorage: "ХранилищеЗначения",
} as const satisfies Record<MetadataPrimitiveType, string>

export function buildMetadataTargetSchema(constraint: MetadataTargetConstraint): TSchema {
  if (constraint.kind === "object") return objectSchema(constraint)
  if (constraint.kind === "field") return fieldSchema(constraint)
  if (constraint.kind === "value") return valueSchema(constraint)
  if (constraint.kind === "type") return typeSchema(constraint)
  if (constraint.kind === "dataPath") return dataPathSchema(constraint)
  if (constraint.kind === "localChild") return localChildSchema(constraint)
  if (constraint.kind === "styleItem") {
    return Type.String({
      pattern: `^ЭлементСтиля\\.${METADATA_NAME_PATTERN}$`,
      examples: ["ЭлементСтиля.ИмяЭлементаСтиля"],
      description: "Ссылка на элемент стиля проекта: ЭлементСтиля.<ИмяЭлементаСтиля>.",
    })
  }
  if (constraint.kind === "commonPicture") {
    return Type.String({
      pattern: `^ОбщаяКартинка\\.${METADATA_NAME_PATTERN}$`,
      examples: ["ОбщаяКартинка.ИмяОбщейКартинки"],
      description: "Ссылка на общую картинку проекта: ОбщаяКартинка.<ИмяОбщейКартинки>.",
    })
  }

  return Type.String({
    description: "Строковое metadata-значение. Подробная проверка выполняется командой validate.",
  })
}

function objectSchema(constraint: Extract<MetadataTargetConstraint, { kind: "object" }>): TSchema {
  const roots = constraint.roots
  const selectedRoots = selectRoots(roots)
  const yamlRoots = yamlRootGroup(roots)
  const tailPattern =
    constraint.allowNested === true ? `(?:\\.(?:${yamlRoots})\\.${METADATA_NAME_PATTERN})*` : ""
  return Type.String({
    pattern:
      selectedRoots.length === 0 ? noMatchPattern : `^((${yamlRoots})\\.${METADATA_NAME_PATTERN}${tailPattern})$`,
    examples: objectExamples(selectedRoots, constraint.allowNested === true),
    description:
      selectedRoots.length === 0
        ? "Ссылка на объект метаданных. Ограничение не разрешает корневые типы; подробная проверка выполняется validate."
        : `Ссылка на объект метаданных: ${yamlRoots}.<ИмяОбъекта>. Реальные имена объектов берутся из YAML-проекта и проверяются validate.`,
  })
}

function fieldSchema(constraint: Extract<MetadataTargetConstraint, { kind: "field" }>): TSchema {
  const selectedRoots = selectRoots(constraint.roots)
  const selectedFieldKinds = constraint.fieldKinds ?? allFieldKinds
  const yamlRoots = yamlRootGroup(constraint.roots)
  const serviceSegments = selectedFieldKinds.map((kind) => fieldKindToYAML[kind]).join("|")
  const serviceSegmentDescription = selectedFieldKinds.map((kind) => fieldKindToYAML[kind]).join(", ")
  const branches: string[] = []
  if (constraint.allowObject === true && selectedRoots.length > 0) {
    branches.push(`(${yamlRoots})\\.${METADATA_NAME_PATTERN}`)
  }
  if (selectedRoots.length > 0 && serviceSegments.length > 0) {
    branches.push(
      `(${yamlRoots})\\.${METADATA_NAME_PATTERN}\\.(?:${serviceSegments})\\.${METADATA_NAME_PATTERN}(?:\\.(?:${serviceSegments})\\.${METADATA_NAME_PATTERN})*`
    )
  }
  return Type.String({
    pattern: branches.length === 0 ? noMatchPattern : `^(?:${branches.join("|")})$`,
    examples: fieldExamples(constraint),
    description:
      serviceSegmentDescription.length === 0
        ? "Полный путь поля метаданных. Ограничение не разрешает служебные сегменты; подробная проверка выполняется validate."
        : `Полный путь поля метаданных: служебные сегменты ${serviceSegmentDescription} обязательны; реальные имена проверяются validate.${constraint.allowObject === true ? " Также разрешена ссылка на объект метаданных без поля." : ""}`,
  })
}

function valueSchema(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): TSchema {
  const branches = valuePatternBranches(constraint)
  return Type.String({
    pattern: branches.length === 0 ? noMatchPattern : `^(?:${branches.join("|")})$`,
    examples: valueExamples(constraint),
    description: valueDescription(constraint),
  })
}

function typeSchema(constraint: Extract<MetadataTargetConstraint, { kind: "type" }>): TSchema {
  const branches = typePatternBranches(constraint)
  return Type.String({
    pattern: branches.length === 0 ? noMatchPattern : `^(?:${branches.join("|")})$`,
    examples: typeExamples(constraint),
    description: typeDescription(constraint),
  })
}

function dataPathSchema(constraint: Extract<MetadataTargetConstraint, { kind: "dataPath" }>): TSchema {
  const allowedKinds =
    constraint.allowedKinds === undefined || constraint.allowedKinds.length === 0
      ? ""
      : ` Допустимые виды значения: ${constraint.allowedKinds.join(", ")}.`
  const composite = constraint.allowComposite === true ? " Составные значения разрешены." : " Составные значения запрещены."
  return Type.String({
    pattern: `^${METADATA_NAME_PATTERN}(?:\\.${METADATA_NAME_PATTERN})*$`,
    examples: ["ИмяРеквизита", "ИмяТаблицы.ИмяКолонки"],
    description: `Путь к данным формы: ИмяРеквизита или ИмяТаблицы.ИмяКолонки.${allowedKinds}${composite} Реальные поля проверяются validate.`,
  })
}

function localChildSchema(constraint: Extract<MetadataTargetConstraint, { kind: "localChild" }>): TSchema {
  const childName = constraint.childKind === "Form" ? "формы" : "макета"
  return Type.String({
    pattern: `^${METADATA_NAME_PATTERN}$`,
    examples: [constraint.childKind === "Form" ? "ИмяФормы" : "ИмяМакета"],
    description: `Имя дочерней ${childName} текущего объекта. Наличие дочернего объекта проверяется validate.`,
  })
}

function yamlRootGroup(roots: readonly MetadataRootName[] | undefined): string {
  const selected = selectRoots(roots)
  return selected.map((root) => rootToYAML[root]).join("|")
}

function selectRoots(roots: readonly MetadataRootName[] | undefined): readonly MetadataRootName[] {
  return roots ?? allRoots
}

function objectExample(root: MetadataRootName): string {
  return objectExampleByRoot[root] ?? `${rootToYAML[root]}.ИмяОбъекта`
}

function objectExamples(roots: readonly MetadataRootName[], allowNested: boolean): string[] {
  const examples = roots.slice(0, 2).map(objectExample)
  if (allowNested && roots.length > 0) {
    const root = roots[0]
    examples.push(`${objectExample(root)}.${rootToYAML[root]}.ИмяПодчиненногоОбъекта`)
  }

  return examples
}

function typeRefExample(root: MetadataRootName): string {
  return typeRefExampleByRoot[root] ?? `${rootToYAML[root]}.ИмяОбъекта`
}

function fieldObjectName(root: MetadataRootName): string {
  return fieldObjectNameByRoot[root] ?? "ИмяОбъекта"
}

function fieldExamples(constraint: Extract<MetadataTargetConstraint, { kind: "field" }>): string[] {
  const selectedRoots = selectRoots(constraint.roots)
  const selectedFieldKinds = constraint.fieldKinds ?? allFieldKinds
  const root = preferredRoot(selectedRoots, "Catalog")
  if (!root) return []

  const rootPrefix = rootToYAML[root]
  const objectName = fieldObjectName(root)
  const examples: string[] = []

  if (constraint.allowObject === true) {
    examples.push(objectExample(root))
  }

  if (selectedFieldKinds.includes("Attribute")) {
    examples.push(`${rootPrefix}.${objectName}.Реквизит.ИмяРеквизита`)
  }

  if (selectedFieldKinds.includes("TabularSection") && selectedFieldKinds.includes("Attribute")) {
    examples.push(`${rootPrefix}.${objectName}.ТабличнаяЧасть.ИмяТабличнойЧасти.Реквизит.ИмяРеквизита`)
  } else if (examples.length === 0 && selectedFieldKinds.includes("TabularSection")) {
    examples.push(`${rootPrefix}.${objectName}.ТабличнаяЧасть.ИмяТабличнойЧасти`)
  } else if (examples.length === 0 && selectedFieldKinds.includes("StandardAttribute")) {
    examples.push(`${rootPrefix}.${objectName}.СтандартныйРеквизит.ИмяСтандартногоРеквизита`)
  } else if (examples.length === 0 && selectedFieldKinds.includes("Dimension")) {
    examples.push(`${rootPrefix}.${objectName}.Измерение.ИмяИзмерения`)
  } else if (examples.length === 0 && selectedFieldKinds.includes("Resource")) {
    examples.push(`${rootPrefix}.${objectName}.Ресурс.ИмяРесурса`)
  }

  return examples
}

function valuePatternBranches(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): string[] {
  const selectedRoots = selectRoots(constraint.roots)
  if (selectedRoots.length === 0) return []

  const allowPredefined = valueKindAllowed(constraint, "predefinedValue")
  const allowEnum = valueKindAllowed(constraint, "enumValue")
  const allowEmptyRef = emptyRefAllowed(constraint)
  const valueName = allowEmptyRef ? METADATA_NAME_PATTERN : `(?!${emptyRefYAML}$)${METADATA_NAME_PATTERN}`
  const branches: string[] = []

  if (allowPredefined) {
    const roots = selectedRoots.filter((root) => root !== "Enum")
    if (roots.length > 0) {
      branches.push(`(?:${yamlRootGroup(roots)})\\.${METADATA_NAME_PATTERN}\\.${valueName}`)
    }
  }

  if (allowEnum && selectedRoots.includes("Enum")) {
    branches.push(`(?:${rootToYAML.Enum})\\.${METADATA_NAME_PATTERN}\\.${valueName}`)
  }

  if (allowEmptyRef) {
    branches.push(`(?:${yamlRootGroup(selectedRoots)})\\.${METADATA_NAME_PATTERN}\\.${emptyRefYAML}`)
  }

  return branches
}

function valueExamples(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): string[] {
  const selectedRoots = selectRoots(constraint.roots)
  const examples: string[] = []

  if (valueKindAllowed(constraint, "predefinedValue") && selectedRoots.some((root) => root !== "Enum")) {
    const root = preferredRoot(selectedRoots.filter((item) => item !== "Enum"), "Catalog")
    if (root === "Catalog") {
      examples.push("Справочник.ИмяСправочника.ИмяПредопределенногоЗначения")
    } else if (root) {
      examples.push(`${rootToYAML[root]}.ИмяОбъекта.ИмяПредопределенногоЗначения`)
    }
  }

  if (valueKindAllowed(constraint, "enumValue") && selectedRoots.includes("Enum")) {
    examples.push("Перечисление.ИмяПеречисления.ИмяЗначения")
  }

  if (emptyRefAllowed(constraint)) {
    const root = preferredRoot(selectedRoots, "Catalog")
    if (root === "Catalog") {
      examples.push("Справочник.ИмяСправочника.ПустаяСсылка")
    } else if (root) {
      examples.push(`${rootToYAML[root]}.ИмяОбъекта.ПустаяСсылка`)
    }
  }

  return examples
}

function valueDescription(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): string {
  const selectedRoots = selectRoots(constraint.roots)
  const predefinedRoots = selectedRoots.filter((root) => root !== "Enum")
  const parts: string[] = []
  if (valueKindAllowed(constraint, "predefinedValue") && predefinedRoots.length > 0) {
    parts.push(`предопределённое значение: ${predefinedValueTemplate(predefinedRoots)}`)
  }
  if (valueKindAllowed(constraint, "enumValue") && selectedRoots.includes("Enum")) {
    parts.push("значение перечисления: Перечисление.<ИмяПеречисления>.<ИмяЗначения>")
  }
  if (emptyRefAllowed(constraint) && selectedRoots.length > 0) {
    parts.push("пустая ссылка: <Корень>.<ИмяОбъекта>.ПустаяСсылка")
  }

  const variants = parts.length === 0 ? "ограничение не разрешает значения" : parts.join("; ")
  return `Значение ссылки: ${variants}. Реальные имена проверяются validate.`
}

function valueKindAllowed(
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>,
  valueKind: "predefinedValue" | "enumValue" | "emptyRef"
): boolean {
  return constraint.valueKinds === undefined || constraint.valueKinds.includes(valueKind)
}

function predefinedValueTemplate(roots: readonly MetadataRootName[]): string {
  if (roots.length === 1 && roots[0] === "Catalog") {
    return "Справочник.<ИмяСправочника>.<ИмяПредопределенногоЗначения>"
  }

  return `${yamlRootGroup(roots)}.<ИмяОбъекта>.<ИмяПредопределенногоЗначения>`
}

function emptyRefAllowed(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): boolean {
  return constraint.allowEmptyRef === true && valueKindAllowed(constraint, "emptyRef")
}

function typePatternBranches(constraint: Extract<MetadataTargetConstraint, { kind: "type" }>): string[] {
  const typeKinds = constraint.typeKinds ?? ["ref", "object", "primitive"]
  const selectedRoots = selectRoots(constraint.roots)
  const branches: string[] = []

  if (typeKinds.includes("ref") && selectedRoots.length > 0) {
    branches.push(`(?:${yamlRootGroup(selectedRoots)})\\.${METADATA_NAME_PATTERN}`)
  }

  if (typeKinds.includes("object") && selectedRoots.length > 0) {
    branches.push(`(?:${yamlRootGroup(selectedRoots)})`)
  }

  if (typeKinds.includes("primitive")) {
    const primitives = constraint.primitives ?? allPrimitiveTypes
    const primitiveBranches = primitives.map((primitive) => primitiveTypePatterns[primitive])
    branches.push(...primitiveBranches.map((branch) => `(?:${branch})`))
  }

  return branches
}

function typeExamples(constraint: Extract<MetadataTargetConstraint, { kind: "type" }>): string[] {
  const typeKinds = constraint.typeKinds ?? ["ref", "object", "primitive"]
  const selectedRoots = selectRoots(constraint.roots)
  const examples: string[] = []
  const root = preferredRoot(selectedRoots, "Catalog")

  if (typeKinds.includes("ref") && root) {
    examples.push(typeRefExample(root))
  }

  if (typeKinds.includes("object") && root) {
    examples.push(rootToYAML[root])
  }

  if (typeKinds.includes("primitive")) {
    const primitives = constraint.primitives ?? allPrimitiveTypes
    for (const primitive of primitives) {
      examples.push(primitiveTypeExamples[primitive])
    }
  }

  return examples
}

function typeDescription(constraint: Extract<MetadataTargetConstraint, { kind: "type" }>): string {
  const typeKinds = constraint.typeKinds ?? ["ref", "object", "primitive"]
  const selectedRoots = selectRoots(constraint.roots)
  const parts: string[] = []

  if (typeKinds.includes("ref") && selectedRoots.length > 0) {
    parts.push(`ссылки на объекты метаданных: ${yamlRootGroup(selectedRoots)}.<ИмяОбъекта>`)
  }

  if (typeKinds.includes("object") && selectedRoots.length > 0) {
    parts.push(`широкие типы объектов: ${yamlRootGroup(selectedRoots)}`)
  }

  if (typeKinds.includes("primitive")) {
    const primitives = constraint.primitives ?? allPrimitiveTypes
    parts.push(`primitive-типы платформы: ${primitives.map((primitive) => primitiveTypeExamples[primitive]).join(", ")}`)
  }

  const variants = parts.length === 0 ? "ограничение не разрешает типы" : parts.join("; ")
  return `Тип metadata-значения: ${variants}. Реальные имена проверяются validate.`
}

function preferredRoot(roots: readonly MetadataRootName[], preferred: MetadataRootName): MetadataRootName | undefined {
  return roots.includes(preferred) ? preferred : roots[0]
}
