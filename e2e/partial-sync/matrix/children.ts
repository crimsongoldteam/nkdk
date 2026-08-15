import type {
  ChildDeclaration,
  ScenarioFileChange,
} from "./types"
import {
  matrixChildInsertionAnchors,
  matrixObjectNames,
  rootObjectDeclarations,
} from "./root-objects"

type OwnerState = {
  readonly path: string
  readonly document: { content: string }
  readonly indent: number
  readonly insertionAnchors?: Readonly<Record<string, string>>
  readonly scope?: {
    readonly header: string
    readonly indentation: number
  }
}

type InlineChildSpec = {
  readonly ownerKey: string
  readonly propertyKey: string
  readonly childItemType: string
  readonly section: string
  readonly name: string
  readonly body?: string
  readonly insertionAnchor?: string
  readonly dependsOn?: readonly string[]
  readonly extraChanges?: readonly ScenarioFileChange[]
  readonly exposeAsOwner?: boolean
  readonly insertionAnchors?: Readonly<Record<string, string>>
  readonly propertyMutation?: PropertyMutation | false
}

type MutableChildDeclaration = Omit<ChildDeclaration, "propertyChanges"> & {
  propertyChanges: ScenarioFileChange[]
}

type PropertyMutation =
  | { readonly kind: "yaml-item"; readonly path: string; readonly name: string; readonly source: string; readonly replacement: string }
  | { readonly kind: "yaml-root"; readonly path: string; readonly source: string; readonly replacement: string }
  | { readonly kind: "file"; readonly path: string; readonly source: string; readonly replacement: string }

const declarations: MutableChildDeclaration[] = []
const propertyMutations = new Map<string, PropertyMutation>()
const ownerStates = createRootOwnerStates()

const attributeOwners = [
  "object:catalog",
  "object:document",
  "object:data-processor",
  "object:report",
  "object:exchange-plan",
  "object:business-process",
  "object:chart-of-accounts",
  "object:chart-of-calculation-types",
  "object:chart-of-characteristic-types",
  "object:task",
] as const

const tabularSectionOwners = [...attributeOwners]

for (const ownerKey of attributeOwners) {
  addInlineChild({
    ownerKey,
    propertyKey: "attributes",
    childItemType: "MetadataAttribute",
    section: "Реквизиты",
    name: "ПроверочныйРеквизит",
    body: "Тип: Строка(10)",
  })
}

for (const ownerKey of tabularSectionOwners) {
  const tabularSection = addInlineChild({
    ownerKey,
    propertyKey: "tabularSections",
    childItemType: "MetadataTabularSection",
    section: "ТабличныеЧасти",
    name: "ПроверочнаяТабличнаяЧасть",
    body: "Синоним: \"\"",
    exposeAsOwner: ownerKey === "object:catalog",
  })
  if (ownerKey === "object:catalog") {
    addInlineChild({
      ownerKey: tabularSection.key,
      propertyKey: "attributes",
      childItemType: "MetadataAttribute",
      section: "Реквизиты",
      name: "ПроверочныйРеквизитТабличнойЧасти",
      body: "Тип: Строка(10)",
    })
  }
}

for (const ownerKey of [
  "object:information-register",
  "object:accumulation-register",
  "object:accounting-register",
  "object:calculation-register",
] as const) {
  const stringFieldBody = "Тип: Строка(10)"

  addInlineChild({
    ownerKey,
    propertyKey: "resources",
    childItemType: "MetadataRegisterResource",
    section: "Ресурсы",
    name: "ПроверочныйРесурс",
    body: "Тип: Число(10, 0)",
  })
  addInlineChild({
    ownerKey,
    propertyKey: "dimensions",
    childItemType: "MetadataRegisterDimension",
    section: "Измерения",
    name: "ПроверочноеИзмерение",
    body: stringFieldBody,
  })
  addInlineChild({
    ownerKey,
    propertyKey: "attributes",
    childItemType: "MetadataRegisterAttribute",
    section: "Реквизиты",
    name: "ПроверочныйРеквизитРегистра",
    body: stringFieldBody,
  })
}

addInlineChild({
  ownerKey: "object:sequence",
  propertyKey: "dimensions",
  childItemType: "MetadataSequenceDimension",
  section: "Измерения",
  name: "ПроверочноеИзмерение",
  body: "Тип: Строка(10)",
})

addInlineChild({
  ownerKey: "object:task",
  propertyKey: "addressingAttributes",
  childItemType: "MetadataTaskAddressingAttribute",
  section: "РеквизитыАдресации",
  name: "ПроверочныйРеквизитАдресации",
  body: "Тип: Строка(10)",
})

for (const ownerKey of [
  "object:catalog",
  "object:chart-of-accounts",
  "object:chart-of-calculation-types",
  "object:chart-of-characteristic-types",
] as const) {
  const predefinedBody = ownerKey === "object:catalog"
    ? "Наименование: Проверочный элемент"
    : ownerKey === "object:chart-of-accounts"
      ? "Забалансовый: Ложь\nКод: \"1\"\nНаименование: Проверочный элемент\nПорядок: \"\""
      : ownerKey === "object:chart-of-calculation-types"
        ? "Код: \"1\"\nНаименование: Проверочный элемент\nПериодДействияБазовый: Ложь"
        : "Код: \"1\"\nНаименование: Проверочный элемент"

  addInlineChild({
    ownerKey,
    propertyKey: "predefined",
    childItemType: "Predefined",
    section: "Предопределенные",
    name: "ПроверочныйПредопределенныйЭлемент",
    body: predefinedBody,
  })
}

addInlineChild({
  ownerKey: "object:enumeration",
  propertyKey: "enumValues",
  childItemType: "MetadataEnumerationValue",
  section: "Значения",
  name: "ПроверочноеЗначение",
  body: "Синоним: \"\"",
})

addInlineChild({
  ownerKey: "object:document-journal",
  propertyKey: "columns",
  childItemType: "MetadataDocumentJournalColumn",
  section: "Графы",
  name: "ПроверочнаяГрафа",
  body: "Ссылки:\n  - Документ.ПроверкаЧастичнойСинхронизацииДокумент.Реквизит.ПроверочныйРеквизит",
  dependsOn: ["child:document:attributes"],
})

const httpTemplate = addInlineChild({
  ownerKey: "object:http-service",
  propertyKey: "urlTemplates",
  childItemType: "MetadataHTTPServiceURLTemplate",
  section: "ШаблоныURL",
  name: "ПроверочныйШаблонURL",
  body: "Шаблон: /partial-sync",
  exposeAsOwner: true,
  insertionAnchors: { Методы: "Шаблон" },
})
addInlineChild({
  ownerKey: httpTemplate.key,
  propertyKey: "methods",
  childItemType: "MetadataHTTPServiceMethod",
  section: "Методы",
  name: "ПроверочныйМетод",
  body: "Обработчик: ПроверочныйШаблонURLПроверочныйМетод\nHTTPМетод: GET",
})

const webServiceOperation = addInlineChild({
  ownerKey: "object:web-service",
  propertyKey: "operations",
  childItemType: "MetadataWebServiceOperation",
  section: "Операции",
  name: "ПроверочнаяОперация",
  body: [
    "ИмяПроцедуры: ПроверочнаяОперация",
    "Комментарий: \"\"",
    "МожетБытьНеопределено: Ложь",
    "РежимУправленияБлокировкойДанных: Управляемый",
    "ТипВозвращаемогоЗначенияXDTO:",
    "  ПространствоИмен: http://www.w3.org/2001/XMLSchema",
    "  Имя: string",
    "Транзакционный: Ложь",
  ].join("\n"),
  exposeAsOwner: true,
  insertionAnchors: { Параметры: "РежимУправленияБлокировкойДанных" },
})
addInlineChild({
  ownerKey: webServiceOperation.key,
  propertyKey: "parameters",
  childItemType: "MetadataWebServiceParameter",
  section: "Параметры",
  name: "ПроверочныйПараметр",
  body: [
    "Комментарий: \"\"",
    "МожетБытьНеопределено: Ложь",
    "НаправлениеПередачи: Входной",
    "ТипЗначенияXDTO:",
    "  ПространствоИмен: http://www.w3.org/2001/XMLSchema",
    "  Имя: string",
  ].join("\n"),
})

addInlineChild({
  ownerKey: "object:integration-service",
  propertyKey: "channels",
  childItemType: "MetadataIntegrationServiceChannel",
  section: "Каналы",
  name: "ПроверочныйКанал",
})

addInlineChild({
  ownerKey: "object:external-data-source",
  propertyKey: "functions",
  childItemType: "MetadataExternalDataSourceFunction",
  section: "Функции",
  name: "ПроверочнаяФункция",
  body: "Тип: Строка(10)",
})

const externalTable = addDirectoryChild({
  ownerKey: "object:external-data-source",
  propertyKey: "tables",
  childItemType: "MetadataExternalDataSourceTable",
  directory: "Таблицы",
  name: "ПроверочнаяТаблица",
  properties: [
    "ИмяВИсточникеДанных: PartialSyncTable",
    "Поля:",
    "  НачальноеПоле:",
    "    Тип: Строка(10)",
    "    ИмяВИсточникеДанных: InitialField",
    "ТипТаблицы: Таблица",
    "ТолькоЧтение: Ложь",
    "",
  ].join("\n"),
  insertionAnchors: { Поля: "ТипТаблицы" },
})
addInlineChild({
  ownerKey: externalTable.key,
  propertyKey: "fields",
  childItemType: "MetadataExternalDataSourceField",
  section: "Поля",
  name: "ПроверочноеПоле",
  body: "Тип: Строка(10)\nИмяВИсточникеДанных: PartialSyncField",
})

const externalCube = addDirectoryChild({
  ownerKey: "object:external-data-source",
  propertyKey: "cubes",
  childItemType: "MetadataExternalDataSourceCube",
  directory: "Кубы",
  name: "ПроверочныйКуб",
  properties: "ИмяВИсточникеДанных: PartialSyncCube\n",
  insertionAnchors: { Измерения: "ИмяВИсточникеДанных" },
})
const dimensionTable = addDirectoryChild({
  ownerKey: externalCube.key,
  propertyKey: "dimensionTables",
  childItemType: "MetadataExternalDataSourceDimensionTable",
  directory: "ТаблицыИзмерений",
  name: "ПроверочнаяТаблицаИзмерения",
  properties: "ИмяВИсточникеДанных: PartialSyncDimensionTable\n",
})
addInlineChild({
  ownerKey: dimensionTable.key,
  propertyKey: "fields",
  childItemType: "MetadataExternalDataSourceField",
  section: "Поля",
  name: "ПроверочноеПоле",
  body: "Тип: Строка(10)\nИмяВИсточникеДанных: PartialSyncDimensionField",
})
addInlineChild({
  ownerKey: externalCube.key,
  propertyKey: "dimensions",
  childItemType: "MetadataExternalDataSourceCubeDimension",
  section: "Измерения",
  name: "ПроверочноеИзмерение",
  body: "Тип: Строка(10)",
  dependsOn: [dimensionTable.key],
})
addInlineChild({
  ownerKey: externalCube.key,
  propertyKey: "resources",
  childItemType: "MetadataExternalDataSourceCubeResource",
  section: "Ресурсы",
  name: "ПроверочныйРесурс",
  body: "Тип: Число(10, 0)\nИмяВИсточникеДанных: PartialSyncResource",
})

const recalculationName = "ПроверочныйПерерасчет"
const recalculationPath = `РегистрРасчета/${matrixObjectNames.calculationRegister}/Перерасчеты/${recalculationName}/Свойства.xml`
const recalculation = addInlineChild({
  ownerKey: "object:calculation-register",
  propertyKey: "recalculations",
  childItemType: "MetadataCalculationRegisterRecalculation",
  section: "Перерасчеты",
  name: recalculationName,
  exposeAsOwner: true,
  propertyMutation: {
    kind: "file",
    path: recalculationPath,
    source: `<Name>${recalculationName}</Name>\r\n\t\t\t<Synonym/>\r\n\t\t\t<Comment>До изменения</Comment>`,
    replacement: `<Name>${recalculationName}</Name>\r\n\t\t\t<Synonym/>\r\n\t\t\t<Comment>После изменения</Comment>`,
  },
  extraChanges: [{
    path: recalculationPath,
    before: null,
    after: recalculationXml(recalculationName),
  }],
})
declarations.push({
  key: childKey(recalculation.key, "dimensions"),
  name: "ПроверочноеИзмерение",
  ownerKey: recalculation.key,
  propertyKey: "dimensions",
  childItemType: "MetadataCalculationRegisterRecalculationDimension",
  dependsOn: [],
  propertyChanges: [],
  changes: [{
    path: recalculationPath,
    before: recalculationXml(recalculationName),
    after: recalculationXml(recalculationName, "ПроверочноеИзмерение"),
  }],
})
propertyMutations.set(childKey(recalculation.key, "dimensions"), {
  kind: "file",
  path: recalculationPath,
  source: "<Name>ПроверочноеИзмерение</Name>\r\n\t\t\t\t\t<Synonym/>\r\n\t\t\t\t\t<Comment>До изменения</Comment>",
  replacement: "<Name>ПроверочноеИзмерение</Name>\r\n\t\t\t\t\t<Synonym/>\r\n\t\t\t\t\t<Comment>После изменения</Comment>",
})

for (const ownerKey of [
  "object:accounting-register",
  "object:accumulation-register",
  "object:business-process",
  "object:calculation-register",
  "object:catalog",
  "object:chart-of-accounts",
  "object:chart-of-calculation-types",
  "object:chart-of-characteristic-types",
  "object:data-processor",
  "object:document",
  "object:document-journal",
  "object:enumeration",
  "object:exchange-plan",
  externalCube.key,
  dimensionTable.key,
  externalTable.key,
  "object:filter-criterion",
  "object:information-register",
  "object:report",
  "object:task",
] as const) {
  addCommand(ownerKey)
}

assignChildPropertyChanges()

export const childDeclarations = declarations as readonly ChildDeclaration[]

export function terminalOwnerYaml(ownerKey: string): { readonly path: string, readonly contents: string } {
  const owner = requireOwnerState(ownerKey)
  return { path: owner.path, contents: owner.document.content }
}

export const childCapabilityExclusions: readonly {
  capability: string
  reason: string
}[] = []

function addInlineChild(spec: InlineChildSpec): MutableChildDeclaration {
  const owner = requireOwnerState(spec.ownerKey)
  const key = childKey(spec.ownerKey, spec.propertyKey)
  const before = owner.document.content
  const body = spec.childItemType === "Predefined" || spec.propertyMutation !== undefined
    ? spec.body
    : withInitialChildComment(spec.body)
  const after = appendYamlItem(owner, spec.section, spec.name, body, spec.insertionAnchor)
  owner.document.content = after
  const declaration: MutableChildDeclaration = {
    key,
    name: spec.name,
    ownerKey: spec.ownerKey,
    propertyKey: spec.propertyKey,
    childItemType: spec.childItemType,
    dependsOn: spec.dependsOn ?? [],
    propertyChanges: [],
    changes: [
      { path: owner.path, before, after },
      ...(spec.extraChanges ?? []),
    ],
  }
  declarations.push(declaration)
  if (spec.propertyMutation === false) {
    // Подчинённый контейнер меняется через отдельный внешний файл.
  } else if (spec.propertyMutation !== undefined) {
    propertyMutations.set(key, spec.propertyMutation)
  } else if (spec.childItemType === "Predefined") {
    propertyMutations.set(key, {
      kind: "yaml-item",
      path: owner.path,
      name: spec.name,
      source: "Наименование: Проверочный элемент",
      replacement: "Наименование: Проверочный элемент изменён",
    })
  } else {
    propertyMutations.set(key, {
      kind: "yaml-item",
      path: owner.path,
      name: spec.name,
      source: "Комментарий: До изменения",
      replacement: "Комментарий: После изменения",
    })
  }
  if (spec.exposeAsOwner === true) {
    ownerStates.set(key, {
      path: owner.path,
      document: owner.document,
      indent: owner.indent + 4,
      insertionAnchors: spec.insertionAnchors,
      scope: {
        header: `${" ".repeat(owner.indent + 2)}${spec.name}:\n`,
        indentation: owner.indent + 2,
      },
    })
  }
  return declaration
}

function addDirectoryChild(spec: {
  readonly ownerKey: string
  readonly propertyKey: string
  readonly childItemType: string
  readonly directory: string
  readonly name: string
  readonly properties: string
  readonly insertionAnchors?: Readonly<Record<string, string>>
}): ChildDeclaration {
  const owner = requireOwnerState(spec.ownerKey)
  const ownerDirectory = owner.path.slice(0, -"/Свойства.yaml".length)
  const path = `${ownerDirectory}/${spec.directory}/${spec.name}/Свойства.yaml`
  const key = childKey(spec.ownerKey, spec.propertyKey)
  const properties = withInitialChildComment(spec.properties)
  const declaration: MutableChildDeclaration = {
    key,
    name: spec.name,
    ownerKey: spec.ownerKey,
    propertyKey: spec.propertyKey,
    childItemType: spec.childItemType,
    dependsOn: [],
    propertyChanges: [],
    changes: [{ path, before: null, after: properties }],
  }
  declarations.push(declaration)
  propertyMutations.set(key, {
    kind: "yaml-root",
    path,
    source: "Комментарий: До изменения",
    replacement: "Комментарий: После изменения",
  })
  ownerStates.set(key, {
    path,
    document: { content: properties },
    indent: 0,
    insertionAnchors: spec.insertionAnchors,
  })
  return declaration
}

function addCommand(ownerKey: string): void {
  const owner = requireOwnerState(ownerKey)
  const ownerDirectory = owner.path.slice(0, -"/Свойства.yaml".length)
  addInlineChild({
    ownerKey,
    propertyKey: "commands",
    childItemType: "MetadataCommand",
    section: "Команды",
    name: "ПроверочнаяКоманда",
    body: "Синоним: \"\"\nГруппа: ПанельДействийСоздать",
    insertionAnchor: findCanonicalKeyAnchor(owner, "Команды"),
    extraChanges: [{
      path: `${ownerDirectory}/Команды/ПроверочнаяКоманда.bsl`,
      before: null,
      after: "&НаКлиенте\nПроцедура ОбработкаКоманды(ПараметрКоманды, ПараметрыВыполненияКоманды)\nКонецПроцедуры\n",
    }],
  })
}

function createRootOwnerStates(): Map<string, OwnerState> {
  const result = new Map<string, OwnerState>()
  for (const root of rootObjectDeclarations) {
    const properties = root.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))
    if (properties === undefined || typeof properties.after !== "string") continue
    const changedProperties = root.propertyChanges.find(({ path }) => path === properties.path)
    const content = changedProperties?.after ?? properties.after
    if (typeof content !== "string") throw new Error(`Свойства ${root.key} перестали быть текстовыми`)
    result.set(root.key, {
      path: properties.path,
      document: { content },
      indent: 0,
      insertionAnchors: matrixChildInsertionAnchors[root.key],
    })
  }
  return result
}

function requireOwnerState(ownerKey: string): OwnerState {
  const owner = ownerStates.get(ownerKey)
  if (owner === undefined) throw new Error(`Не найден YAML владельца ${ownerKey}`)
  return owner
}

function assignChildPropertyChanges(): void {
  const currentFiles = new Map<string, string>()
  for (const declaration of declarations) {
    for (const change of declaration.changes) {
      if (typeof change.after === "string") currentFiles.set(change.path, change.after)
    }
  }

  for (const declaration of declarations) {
    const mutation = propertyMutations.get(declaration.key)
    if (mutation === undefined) throw new Error(`Не объявлено изменение свойства ${declaration.key}`)
    const before = currentFiles.get(mutation.path)
    if (before === undefined) throw new Error(`Не найден текстовый файл свойства ${declaration.key}: ${mutation.path}`)
    let after: string
    try {
      after = mutation.kind === "yaml-item"
        ? replaceInYamlItem(before, mutation.name, mutation.source, mutation.replacement)
        : mutation.kind === "yaml-root"
          ? replaceInYamlRoot(before, mutation.source, mutation.replacement)
          : replaceExactlyOnce(before, mutation.source, mutation.replacement)
    } catch (caught) {
      throw new Error(`Не удалось изменить свойство ${declaration.key}: ${caught instanceof Error ? caught.message : String(caught)}`)
    }
    declaration.propertyChanges = [{ path: mutation.path, before, after }]
    currentFiles.set(mutation.path, after)
  }
}

function withInitialChildComment(body = ""): string {
  const source = body === "" || body.endsWith("\n") ? body : `${body}\n`
  if (/^Комментарий:/mu.test(source)) {
    return source.replace(/^Комментарий:.*$/mu, "Комментарий: До изменения").replace(/\n$/u, "")
  }
  const insertion = [...source.matchAll(/^(\S[^:\r\n]*):/gmu)]
    .find((match) => (match[1] ?? "").localeCompare("Комментарий", "ru") > 0)
  const comment = "Комментарий: До изменения\n"
  const result = insertion === undefined
    ? `${source}${comment}`
    : `${source.slice(0, insertion.index)}${comment}${source.slice(insertion.index)}`
  return result.replace(/\n$/u, "")
}

function replaceInYamlItem(source: string, name: string, before: string, after: string): string {
  const lines = source.split("\n")
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const header = new RegExp(`^(\\s*)${escapedName}:\\s*$`, "u")
  const headerIndex = lines.findIndex((line) => header.test(line))
  if (headerIndex < 0) throw new Error(`Не найден YAML-элемент ${name}`)
  const indentation = header.exec(lines[headerIndex] ?? "")?.[1].length ?? 0
  let endIndex = lines.length
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.trim() === "") continue
    const currentIndentation = line.length - line.trimStart().length
    if (currentIndentation <= indentation) {
      endIndex = index
      break
    }
  }
  const matches: number[] = []
  for (let index = headerIndex + 1; index < endIndex; index += 1) {
    const line = lines[index] ?? ""
    const currentIndentation = line.length - line.trimStart().length
    if (currentIndentation === indentation + 2 && line.trim() === before) matches.push(index)
  }
  if (matches.length !== 1) {
    throw new Error(`Ожидалось одно прямое свойство ${before}, найдено ${matches.length}: ${lines.slice(Math.max(0, headerIndex - 6), Math.min(lines.length, endIndex + 12)).join("\\n")}`)
  }
  const index = matches[0]!
  lines[index] = `${" ".repeat(indentation + 2)}${after}`
  return lines.join("\n")
}

function replaceInYamlRoot(source: string, before: string, after: string): string {
  const lines = source.split("\n")
  const matches = lines.flatMap((line, index) => line === before ? [index] : [])
  if (matches.length !== 1) {
    throw new Error(`Ожидалось одно корневое свойство ${before}, найдено ${matches.length}`)
  }
  lines[matches[0]!] = after
  return lines.join("\n")
}

function replaceExactlyOnce(source: string, before: string, after: string): string {
  const first = source.indexOf(before)
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Ожидалось одно вхождение изменения свойства: ${before}`)
  }
  return `${source.slice(0, first)}${after}${source.slice(first + before.length)}`
}

function appendYamlItem(
  owner: OwnerState,
  section: string,
  name: string,
  body = "",
  explicitInsertionAnchor?: string,
): string {
  const indentation = " ".repeat(owner.indent)
  const sectionMarker = `${indentation}${section}:\n`
  const source = owner.document.content === "" || owner.document.content.endsWith("\n")
    ? owner.document.content
    : `${owner.document.content}\n`
  const scope = owner.scope === undefined
    ? { prefix: "", content: source, suffix: "" }
    : findOwnerScope(source, owner.scope)
  const changedContent = appendYamlItemToSource(
    scope.content,
    owner,
    sectionMarker,
    indentation,
    section,
    name,
    body,
    explicitInsertionAnchor,
  )
  return `${scope.prefix}${changedContent}${scope.suffix}`
}

function appendYamlItemToSource(
  source: string,
  owner: OwnerState,
  sectionMarker: string,
  indentation: string,
  section: string,
  name: string,
  body: string,
  explicitInsertionAnchor?: string,
): string {
  const configuredAnchor = explicitInsertionAnchor ?? owner.insertionAnchors?.[section]
  const insertionAnchor = earlierInsertionAnchor(
    owner,
    section,
    configuredAnchor,
  )
  const insertionIndex = insertionAnchor === undefined
    ? -1
    : yamlKeyLineIndex(source, indentation, insertionAnchor)
  const prefix = insertionIndex < 0 ? source : source.slice(0, insertionIndex)
  const suffix = insertionIndex < 0 ? "" : source.slice(insertionIndex)
  const sectionPrefix = prefix.includes(sectionMarker) ? "" : sectionMarker
  const itemIndentation = `${indentation}  `
  if (body === "") return `${prefix}${sectionPrefix}${itemIndentation}${name}:\n${suffix}`
  const bodyIndentation = `${indentation}    `
  const indentedBody = body.split("\n").map((line) => `${bodyIndentation}${line}`).join("\n")
  return `${prefix}${sectionPrefix}${itemIndentation}${name}:\n${indentedBody}\n${suffix}`
}

function earlierInsertionAnchor(
  owner: OwnerState,
  section: string,
  configuredAnchor: string | undefined,
): string | undefined {
  const canonicalAnchor = findCanonicalKeyAnchor(owner, section)
  if (configuredAnchor === undefined || canonicalAnchor === undefined) {
    return configuredAnchor ?? canonicalAnchor
  }
  const source = owner.document.content === "" || owner.document.content.endsWith("\n")
    ? owner.document.content
    : `${owner.document.content}\n`
  const content = owner.scope === undefined ? source : findOwnerScope(source, owner.scope).content
  const indentation = " ".repeat(owner.indent)
  const configuredIndex = yamlKeyLineIndex(content, indentation, configuredAnchor)
  const canonicalIndex = yamlKeyLineIndex(content, indentation, canonicalAnchor)
  if (configuredIndex < 0) return canonicalAnchor
  if (canonicalIndex < 0) return configuredAnchor
  return configuredIndex <= canonicalIndex ? configuredAnchor : canonicalAnchor
}

function findCanonicalKeyAnchor(owner: OwnerState, section: string): string | undefined {
  const source = owner.document.content === "" || owner.document.content.endsWith("\n")
    ? owner.document.content
    : `${owner.document.content}\n`
  const content = owner.scope === undefined ? source : findOwnerScope(source, owner.scope).content
  const indentation = " ".repeat(owner.indent)
  const keys = content.split("\n").flatMap((line) => {
    if (!line.startsWith(indentation) || line[indentation.length] === " ") return []
    const separator = line.indexOf(":", indentation.length)
    return separator < 0 ? [] : [line.slice(indentation.length, separator)]
  })
  return keys.find((key) => key.localeCompare(section, "ru") > 0)
}

function yamlKeyLineIndex(source: string, indentation: string, key: string): number {
  const marker = `${indentation}${key}:`
  let offset = 0
  for (const line of source.split("\n")) {
    if (line.startsWith(marker)) return offset
    offset += line.length + 1
  }
  return -1
}

function findOwnerScope(
  source: string,
  scope: NonNullable<OwnerState["scope"]>,
): { readonly prefix: string, readonly content: string, readonly suffix: string } {
  const headerIndex = source.indexOf(scope.header)
  if (headerIndex < 0) throw new Error(`Не найден заголовок владельца ${scope.header.trim()}`)
  const contentStart = headerIndex + scope.header.length
  const linePattern = /^( *)(?=\S)/gmu
  linePattern.lastIndex = contentStart
  let contentEnd = source.length
  for (let match = linePattern.exec(source); match !== null; match = linePattern.exec(source)) {
    if (match.index < contentStart) continue
    if ((match[1]?.length ?? 0) <= scope.indentation) {
      contentEnd = match.index
      break
    }
  }
  return {
    prefix: source.slice(0, contentStart),
    content: source.slice(contentStart, contentEnd),
    suffix: source.slice(contentEnd),
  }
}

function childKey(ownerKey: string, propertyKey: string): string {
  return `child:${ownerKey.replace(/^(object|child):/, "").replaceAll(":", "-")}:${propertyKey}`
}

function recalculationXml(name: string, dimensionName?: string): string {
  const childObjects = dimensionName === undefined
    ? ["\t\t<ChildObjects/>"]
    : recalculationDimensionXml(dimensionName)
  return [
    '\uFEFF<?xml version="1.0" encoding="UTF-8"?>',
    '<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">',
    '\t<Recalculation uuid="10000000-0000-4000-8000-000000000001">',
    '\t\t<InternalInfo>',
    `\t\t\t<xr:GeneratedType name="RecalculationRecord.${matrixObjectNames.calculationRegister}.${name}" category="Record">`,
    '\t\t\t\t<xr:TypeId>10000000-0000-4000-8000-000000000002</xr:TypeId>',
    '\t\t\t\t<xr:ValueId>10000000-0000-4000-8000-000000000003</xr:ValueId>',
    '\t\t\t</xr:GeneratedType>',
    `\t\t\t<xr:GeneratedType name="RecalculationManager.${matrixObjectNames.calculationRegister}.${name}" category="Manager">`,
    '\t\t\t\t<xr:TypeId>10000000-0000-4000-8000-000000000004</xr:TypeId>',
    '\t\t\t\t<xr:ValueId>10000000-0000-4000-8000-000000000005</xr:ValueId>',
    '\t\t\t</xr:GeneratedType>',
    `\t\t\t<xr:GeneratedType name="RecalculationRecordSet.${matrixObjectNames.calculationRegister}.${name}" category="RecordSet">`,
    '\t\t\t\t<xr:TypeId>10000000-0000-4000-8000-000000000006</xr:TypeId>',
    '\t\t\t\t<xr:ValueId>10000000-0000-4000-8000-000000000007</xr:ValueId>',
    '\t\t\t</xr:GeneratedType>',
    '\t\t</InternalInfo>',
    '\t\t<Properties>',
    `\t\t\t<Name>${name}</Name>`,
    '\t\t\t<Synonym/>',
    '\t\t\t<Comment>До изменения</Comment>',
    '\t\t\t<DataLockControlMode>Managed</DataLockControlMode>',
    '\t\t</Properties>',
    ...childObjects,
    '\t</Recalculation>',
    '</MetaDataObject>',
  ].join("\r\n")
}

function recalculationDimensionXml(name: string): readonly string[] {
  const registerDimension = `CalculationRegister.${matrixObjectNames.calculationRegister}.Dimension.${name}`
  return [
    "\t\t<ChildObjects>",
    '\t\t\t<Dimension uuid="10000000-0000-4000-8000-000000000008">',
    "\t\t\t\t<Properties>",
    `\t\t\t\t\t<Name>${name}</Name>`,
    "\t\t\t\t\t<Synonym/>",
    "\t\t\t\t\t<Comment>До изменения</Comment>",
    `\t\t\t\t\t<RegisterDimension>${registerDimension}</RegisterDimension>`,
    "\t\t\t\t\t<LeadingRegisterData>",
    `\t\t\t\t\t\t<xr:Item xsi:type="xr:MDObjectRef">${registerDimension}</xr:Item>`,
    "\t\t\t\t\t</LeadingRegisterData>",
    "\t\t\t\t</Properties>",
    "\t\t\t</Dimension>",
    "\t\t</ChildObjects>",
  ]
}
