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
}

type InlineChildSpec = {
  readonly ownerKey: string
  readonly propertyKey: string
  readonly childItemType: string
  readonly section: string
  readonly name: string
  readonly body?: string
  readonly dependsOn?: readonly string[]
  readonly extraChanges?: readonly ScenarioFileChange[]
  readonly exposeAsOwner?: boolean
  readonly insertionAnchors?: Readonly<Record<string, string>>
}

const declarations: ChildDeclaration[] = []
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
  const stringFieldBody = ownerKey === "object:information-register"
    ? "Тип: Строка(10)\nЗначениеЗаполнения: \"\""
    : "Тип: Строка(10)"

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
  body: "Тип: Строка(10)\nЗначениеЗаполнения: \"\"",
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
    "ТипТаблицы: Таблица",
    "ТолькоЧтение: Ложь",
    "Поля:",
    "  НачальноеПоле:",
    "    Тип: Строка(10)",
    "    ИмяВИсточникеДанных: InitialField",
    "",
  ].join("\n"),
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
  body: "Тип: ПроверкаЧастичнойСинхронизацииВнешнийИсточникДанных.ПроверочныйКуб.ПроверочнаяТаблицаИзмерения",
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
const recalculation = addInlineChild({
  ownerKey: "object:calculation-register",
  propertyKey: "recalculations",
  childItemType: "Recalculation",
  section: "Перерасчеты",
  name: recalculationName,
  body: "Синоним: \"\"",
  exposeAsOwner: true,
  extraChanges: [{
    path: `РегистрРасчета/${matrixObjectNames.calculationRegister}/Перерасчеты/${recalculationName}/Recalculation.xml`,
    before: null,
    after: recalculationXml(recalculationName),
  }],
})
addInlineChild({
  ownerKey: recalculation.key,
  propertyKey: "dimensions",
  childItemType: "MetadataRegisterDimension",
  section: "Измерения",
  name: "ПроверочноеИзмерение",
  body: "Тип: Строка(10)",
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

export const childDeclarations = declarations as readonly ChildDeclaration[]

export const childCapabilityExclusions: readonly {
  capability: string
  reason: string
}[] = []

function addInlineChild(spec: InlineChildSpec): ChildDeclaration {
  const owner = requireOwnerState(spec.ownerKey)
  const key = childKey(spec.ownerKey, spec.propertyKey)
  const before = owner.document.content
  const after = appendYamlItem(owner, spec.section, spec.name, spec.body)
  owner.document.content = after
  const declaration: ChildDeclaration = {
    key,
    ownerKey: spec.ownerKey,
    propertyKey: spec.propertyKey,
    childItemType: spec.childItemType,
    dependsOn: spec.dependsOn ?? [],
    changes: [
      { path: owner.path, before, after },
      ...(spec.extraChanges ?? []),
    ],
  }
  declarations.push(declaration)
  if (spec.exposeAsOwner === true) {
    ownerStates.set(key, {
      path: owner.path,
      document: owner.document,
      indent: owner.indent + 4,
      insertionAnchors: spec.insertionAnchors,
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
}): ChildDeclaration {
  const owner = requireOwnerState(spec.ownerKey)
  const ownerDirectory = owner.path.slice(0, -"/Свойства.yaml".length)
  const path = `${ownerDirectory}/${spec.directory}/${spec.name}/Свойства.yaml`
  const key = childKey(spec.ownerKey, spec.propertyKey)
  const declaration: ChildDeclaration = {
    key,
    ownerKey: spec.ownerKey,
    propertyKey: spec.propertyKey,
    childItemType: spec.childItemType,
    dependsOn: [],
    changes: [{ path, before: null, after: spec.properties }],
  }
  declarations.push(declaration)
  ownerStates.set(key, { path, document: { content: spec.properties }, indent: 0 })
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
    result.set(root.key, {
      path: properties.path,
      document: { content: properties.after },
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

function appendYamlItem(owner: OwnerState, section: string, name: string, body = ""): string {
  const indentation = " ".repeat(owner.indent)
  const sectionMarker = `${indentation}${section}:\n`
  const source = owner.document.content === "" || owner.document.content.endsWith("\n")
    ? owner.document.content
    : `${owner.document.content}\n`
  const insertionAnchor = owner.insertionAnchors?.[section]
  const anchorMarker = insertionAnchor === undefined
    ? undefined
    : `${indentation}${insertionAnchor}:`
  const insertionIndex = anchorMarker === undefined ? -1 : source.indexOf(anchorMarker)
  const prefix = insertionIndex < 0 ? source : source.slice(0, insertionIndex)
  const suffix = insertionIndex < 0 ? "" : source.slice(insertionIndex)
  const sectionPrefix = prefix.includes(sectionMarker) ? "" : sectionMarker
  const itemIndentation = `${indentation}  `
  if (body === "") return `${prefix}${sectionPrefix}${itemIndentation}${name}:\n${suffix}`
  const bodyIndentation = `${indentation}    `
  const indentedBody = body.split("\n").map((line) => `${bodyIndentation}${line}`).join("\n")
  return `${prefix}${sectionPrefix}${itemIndentation}${name}:\n${indentedBody}\n${suffix}`
}

function childKey(ownerKey: string, propertyKey: string): string {
  return `child:${ownerKey.replace(/^(object|child):/, "").replaceAll(":", "-")}:${propertyKey}`
}

function recalculationXml(name: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" version="2.20">
  <Recalculation uuid="10000000-0000-4000-8000-000000000001">
    <InternalInfo>
      <xr:GeneratedType name="RecalculationRecord.${matrixObjectNames.calculationRegister}.${name}" category="Record">
        <xr:TypeId>10000000-0000-4000-8000-000000000002</xr:TypeId>
        <xr:ValueId>10000000-0000-4000-8000-000000000003</xr:ValueId>
      </xr:GeneratedType>
      <xr:GeneratedType name="RecalculationManager.${matrixObjectNames.calculationRegister}.${name}" category="Manager">
        <xr:TypeId>10000000-0000-4000-8000-000000000004</xr:TypeId>
        <xr:ValueId>10000000-0000-4000-8000-000000000005</xr:ValueId>
      </xr:GeneratedType>
      <xr:GeneratedType name="RecalculationRecordSet.${matrixObjectNames.calculationRegister}.${name}" category="RecordSet">
        <xr:TypeId>10000000-0000-4000-8000-000000000006</xr:TypeId>
        <xr:ValueId>10000000-0000-4000-8000-000000000007</xr:ValueId>
      </xr:GeneratedType>
    </InternalInfo>
    <Properties>
      <Name>${name}</Name>
      <Synonym />
      <Comment />
      <DataLockControlMode>Managed</DataLockControlMode>
    </Properties>
    <ChildObjects />
  </Recalculation>
</MetaDataObject>
`
}
