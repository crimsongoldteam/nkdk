import { ConfigurationContext } from "~/metadata/context/types"
import {
  CollectableElementType,
  CollectableElementTypeToYAML,
  ExportToYAMLFunctionNew,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
  ImportFromYAMLFunctionNew,
  PropertyRule,
  ToMetadata,
  ToTypedYAML,
  ToYAML,
  exportPropertyToYAML,
} from "~/metadata/orchestration"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { exportElementToYAML, exportFormElementTypeToYAML } from "~/metadata/orchestration/formElement/toYAML"
import { ChildItem, FormElementTreeNodeYAML, FormElementTreeYAML, TypedElement } from "./types"

const childItemsTreePropertyTypes = [
  "GroupChildItems",
  "CommandBarChildItems",
  "TableChildItems",
  "PagesChildItems",
] as const

type ChildItemsTreePropertyType = (typeof childItemsTreePropertyTypes)[number]

const childItemTypesByPropertyType = {
  GroupChildItems: [
    "Button",
    "CalendarField",
    "ChartField",
    "CheckBoxField",
    "CommandBar",
    "DendrogramField",
    "FormattedDocumentField",
    "GanttChartField",
    "GeographicalSchemaField",
    "GraphicalSchemaField",
    "HTMLDocumentField",
    "InputField",
    "LabelDecoration",
    "LabelField",
    "Pages",
    "PDFDocumentField",
    "PeriodField",
    "PictureDecoration",
    "PictureField",
    "PlannerField",
    "ProgressBarField",
    "RadioButtonField",
    "SearchControlAddition",
    "SearchStringAddition",
    "SpreadSheetDocumentField",
    "Table",
    "TextDocumentField",
    "TrackBarField",
    "UsualGroup",
    "ViewStatusAddition",
  ],
  CommandBarChildItems: [
    "Button",
    "CommandBarButton",
    "ButtonGroup",
    "Popup",
    "SearchStringAddition",
    "SearchControlAddition",
    "ViewStatusAddition",
  ],
  TableChildItems: ["TableCheckBoxField", "ColumnGroup", "TableInputField", "TableLabelField", "TablePictureField"],
  PagesChildItems: ["Page"],
} as const satisfies Record<ChildItemsTreePropertyType, readonly CollectableElementType[]>

const elementTypesByYAMLKind = Object.entries(CollectableElementTypeToYAML).reduce<
  Record<string, CollectableElementType[]>
>((acc, [itemType, yamlKind]) => {
  const key = yamlKind
  const values = acc[key] ?? []
  values.push(itemType as CollectableElementType)
  acc[key] = values
  return acc
}, {})

export const exportChildItemsToTreeYAML = <From extends ChildItem>(params: {
  context: ConfigurationContext
  items: readonly From[] | undefined
}): FormElementTreeYAML | undefined => {
  const { context, items } = params
  if (!items || items.length === 0) return undefined

  const result: FormElementTreeYAML = {}
  for (const item of items) {
    result[item.name] = exportChildItemToTreeNodeYAML({ context, item })
  }

  return result
}

export const exportChildItemToTreeNodeYAML = <From extends ChildItem>(params: {
  context: ConfigurationContext
  item: From
}): FormElementTreeNodeYAML => {
  const { context, item } = params
  const properties = exportElementToYAML({
    context,
    element: item as ToMetadata<From["itemType"]>,
    rule: getElementRule(item.itemType),
  }) as Record<string, unknown> | undefined
  const nodeProperties = moveButtonTypeToTreeYAML({
    itemType: item.itemType,
    yaml: {
      ...(properties ?? {}),
      ...exportTreeOnlyDataPath({ context, item }),
    },
  })

  const result: FormElementTreeNodeYAML = {
    Вид: exportFormElementTypeToYAML(context, item.itemType),
    ...nodeProperties,
  }

  return result
}

export const importChildItemsFromTreeYAML = <To extends readonly ChildItem[]>(params: {
  context: ConfigurationContext
  yaml: Record<string, unknown> | undefined
  propertyType?: ChildItemsTreePropertyType
}): To => {
  const { context, yaml } = params
  const propertyType = params.propertyType ?? "GroupChildItems"
  if (yaml === undefined) return castImportedChildItems<To>([])
  if (!isRecord(yaml)) throw new Error('Поле "Элементы" должно быть объектом')

  const result: ChildItem[] = []
  for (const [name, node] of Object.entries(yaml)) {
    result.push(importChildItemFromTreeNodeYAML({ context, name, node, propertyType }))
  }

  return castImportedChildItems<To>(result)
}

export const importChildItemFromTreeNodeYAML = <To extends ChildItem>(params: {
  context: ConfigurationContext
  name: string
  node: unknown
  propertyType?: ChildItemsTreePropertyType
}): To => {
  const { context, name, node } = params
  const propertyType = params.propertyType ?? "GroupChildItems"

  const treeNode = getTreeNodeObject({ name, node })
  const yamlKind = getTreeNodeDiscriminator({ name, node: treeNode })
  const itemType = getItemTypeFromYAMLKind({ name, yamlKind, propertyType })
  const element = importElementFromPartialYAML({
    context,
    itemType,
    yaml: toElementYAML({ itemType, node: treeNode }),
    source: createElementSource({ itemType, name }),
  })

  const result = {
    ...element,
    itemType,
    name,
  } as ChildItem & Record<string, unknown>

  return result as To
}

export const exportChildItemsToTreeYAMLProperty: ExportToYAMLFunctionNew = (params) => {
  return exportChildItemsToTreeYAML({
    context: params.context,
    items: params.value as readonly ChildItem[] | undefined,
  })
}

export const importChildItemsFromTreeYAMLProperty: ImportFromYAMLFunctionNew = (params) => {
  if (params.value === undefined && Array.isArray(params.source)) {
    return importChildItemsFromPartialYAML({
      context: params.context,
      source: params.source as ChildItem[],
    })
  }

  if (
    params.context.allElements !== undefined &&
    Array.isArray(params.source) &&
    isLegacyTypedChildItemsYAML(params.value)
  ) {
    return importChildItemsFromLegacyTypedYAML({
      context: params.context,
      yaml: params.value,
    })
  }

  const propertyType = getChildItemsTreePropertyType(params.rule)
  return importChildItemsFromTreeYAML({
    context: params.context,
    yaml: params.value,
    propertyType,
  })
}

export const isChildItemsTreeRule = (rule: PropertyRule): boolean => {
  return isChildItemsTreePropertyType(rule.type)
}

const importChildItemsFromPartialYAML = (params: {
  context: ConfigurationContext
  source: ChildItem[]
}): ChildItem[] => {
  const { context, source } = params
  const childItemsProperties = context.allElements ?? {}

  return source.map((item) => {
    const propertiesYAML = childItemsProperties[item.name] as ToYAML<ChildItem["itemType"]>
    const sourceItem = dropSyntheticTableLabelDataPath({ item, propertiesYAML })

    return importElementFromPartialYAML({
      context,
      itemType: sourceItem.itemType,
      yaml: propertiesYAML,
      source: sourceItem as ToMetadata<ChildItem["itemType"]>,
    })! as ChildItem
  })
}

const importChildItemsFromLegacyTypedYAML = (params: {
  context: ConfigurationContext
  yaml: Record<string, Record<string, unknown>>
}): ChildItem[] => {
  const { context, yaml } = params

  const result: ChildItem[] = []
  for (const [name, item] of Object.entries(yaml)) {
    result.push(
      importElementFromTypedYAML({
        context,
        yaml: item as ToTypedYAML<TypedElement["itemType"]>,
        name,
      }) as ChildItem
    )
  }

  return result
}

const getTreeNodeObject = (params: {
  name: string
  node: unknown
}): Record<string, unknown> => {
  const { name, node } = params
  if (!isRecord(node)) throw new Error(`Элемент "${name}": должен быть объектом`)
  if (typeof node.Вид !== "string") throw new Error(`Элемент "${name}": обязательное поле "Вид" не задано`)
  return node
}

const getTreeNodeDiscriminator = (params: { name: string; node: Record<string, unknown> }): string => {
  const { node } = params
  return node.Вид as string
}

const getItemTypeFromYAMLKind = (params: {
  name: string
  yamlKind: string
  propertyType: ChildItemsTreePropertyType
}): CollectableElementType => {
  const { name, yamlKind, propertyType } = params
  const candidates = elementTypesByYAMLKind[yamlKind] ?? []
  const allowedTypes = new Set<CollectableElementType>(childItemTypesByPropertyType[propertyType])
  const itemType = candidates.find((candidate) => allowedTypes.has(candidate))

  if (itemType === undefined) {
    throw new Error(`Элемент "${name}": неизвестный Вид "${yamlKind}"`)
  }

  return itemType
}

const moveButtonTypeToTreeYAML = (params: {
  itemType: CollectableElementType
  yaml: Record<string, unknown> | undefined
}): Record<string, unknown> => {
  const result = { ...(params.yaml ?? {}) }
  if (isButtonElementType(params.itemType) && result.Вид !== undefined) {
    result.ТипКнопки = result.Вид
    delete result.Вид
  }
  return result
}

const exportTreeOnlyDataPath = (params: {
  context: ConfigurationContext
  item: ChildItem
}): Record<string, unknown> | undefined => {
  const { context, item } = params
  if (!("dataPath" in item)) return undefined

  const dataPathRule = getElementRule(item.itemType).properties.dataPath
  if (dataPathRule?.yaml === undefined) return undefined

  return exportPropertyToYAML({
    context: {
      ...context,
      exportToYAML: {
        ...(context.exportToYAML ?? {}),
        toTyped: true,
      },
    },
    rule: dataPathRule,
    value: item.dataPath,
    name: item.name,
  })
}

const toElementYAML = <Type extends CollectableElementType>(params: {
  itemType: Type
  node: Record<string, unknown>
}): ToYAML<Type> => {
  const { itemType, node } = params
  const { Вид: _kind, Тип: _legacyKind, ТипКнопки: buttonType, ...yaml } = node
  if (isButtonElementType(itemType) && buttonType !== undefined) {
    return {
      ...yaml,
      Вид: buttonType,
    } as ToYAML<Type>
  }

  return yaml as ToYAML<Type>
}

const createElementSource = <Type extends CollectableElementType>(params: {
  itemType: Type
  name: string
}): ToMetadata<Type> => {
  return {
    itemType: params.itemType,
    name: params.name,
  } as ToMetadata<Type>
}

const getChildItemsTreePropertyType = (rule: PropertyRule): ChildItemsTreePropertyType => {
  if (!isChildItemsTreePropertyType(rule.type)) return "GroupChildItems"
  return rule.type
}

const isChildItemsTreePropertyType = (value: string): value is ChildItemsTreePropertyType => {
  return childItemsTreePropertyTypes.some((propertyType) => propertyType === value)
}

const isButtonElementType = (itemType: CollectableElementType): itemType is "Button" | "CommandBarButton" => {
  return itemType === "Button" || itemType === "CommandBarButton"
}

const isLegacyTypedChildItemsYAML = (value: unknown): value is Record<string, Record<string, unknown>> => {
  if (!isRecord(value)) return false

  return Object.values(value).some((item) => isRecord(item) && typeof item.Тип === "string" && item.Вид === undefined)
}

const dropSyntheticTableLabelDataPath = (params: {
  item: ChildItem
  propertiesYAML: ToYAML<ChildItem["itemType"]> | undefined
}): ChildItem => {
  const { item, propertiesYAML } = params

  if (item.itemType !== "TableLabelField") return item
  if (!("dataPath" in item)) return item
  if (item.dataPath !== item.name) return item
  if (propertiesYAML && typeof propertiesYAML === "object" && "ПутьКДанным" in propertiesYAML) return item

  const result = { ...item }
  delete (result as { dataPath?: string }).dataPath
  return result
}

const castImportedChildItems = <To extends readonly ChildItem[]>(items: ChildItem[]): To => {
  return items as unknown as To
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
