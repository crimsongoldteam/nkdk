import { ConfigurationContext } from "~/metadata/context/types"
import {
  CollectableElementType,
  CollectableElementTypeToYAML,
  ExportToYAMLFunctionNew,
  importElementFromPartialYAML,
  ImportFromYAMLFunctionNew,
  PropertyRule,
  ToMetadata,
  ToYAML,
} from "~/metadata/orchestration"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { exportElementToYAML, exportFormElementTypeToYAML } from "~/metadata/orchestration/formElement/toYAML"
import { ChildItem, FormElementTreeNodeYAML, FormElementTreeYAML } from "./types"

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

const childItemsPropertyTypeByElementType: Partial<Record<CollectableElementType, ChildItemsTreePropertyType>> = {
  UsualGroup: "GroupChildItems",
  Page: "GroupChildItems",
  CommandBar: "CommandBarChildItems",
  Table: "TableChildItems",
  ColumnGroup: "TableChildItems",
  Pages: "PagesChildItems",
}

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
  const yamlContext = createFullElementYAMLContext(context)
  const properties = exportElementToYAML({
    context: yamlContext,
    element: item as ToMetadata<From["itemType"]>,
    rule: getElementRule(item.itemType),
  }) as Record<string, unknown> | undefined

  const result: FormElementTreeNodeYAML = {
    Вид: exportFormElementTypeToYAML(context, item.itemType),
    ...(properties ?? {}),
  }
  result.Вид = exportFormElementTypeToYAML(context, item.itemType)

  const childItems = getChildItems(item)
  const childItemsYAML = exportChildItemsToTreeYAML({ context, items: childItems })
  if (childItemsYAML !== undefined) {
    result.Элементы = childItemsYAML
  }

  addAutoCommandBarTreeYAML({ context, item, node: result })

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
  const yamlKind = treeNode.Вид
  const itemType = getItemTypeFromYAMLKind({ name, yamlKind, propertyType })
  const element = importElementFromPartialYAML({
    context,
    itemType,
    yaml: toElementYAML(itemType, treeNode),
    source: createElementSource({ itemType, name }),
  })

  const result = {
    ...element,
    itemType,
    name,
  } as ChildItem & Record<string, unknown>

  const childItemsPropertyType = childItemsPropertyTypeByElementType[itemType]
  if (treeNode.Элементы !== undefined) {
    if (!isRecord(treeNode.Элементы)) throw new Error(`Элемент "${name}": поле "Элементы" должно быть объектом`)
    if (childItemsPropertyType !== undefined) {
      result.childItems = importChildItemsFromTreeYAML({
        context,
        yaml: treeNode.Элементы,
        propertyType: childItemsPropertyType,
      })
    }
  }

  importAutoCommandBarFromTreeYAML({ context, node: treeNode, item: result })

  return result as To
}

export const exportChildItemsToTreeYAMLProperty: ExportToYAMLFunctionNew = (params) => {
  return exportChildItemsToTreeYAML({
    context: params.context,
    items: params.value as readonly ChildItem[] | undefined,
  })
}

export const importChildItemsFromTreeYAMLProperty: ImportFromYAMLFunctionNew = (params) => {
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

const createFullElementYAMLContext = (context: ConfigurationContext): ConfigurationContext => ({
  ...context,
  exportToYAML: {
    ...(context.exportToYAML ?? {}),
    toTyped: true,
  },
})

const getChildItems = (item: ChildItem): readonly ChildItem[] | undefined => {
  const value = (item as { childItems?: unknown }).childItems
  if (!Array.isArray(value)) return undefined
  return value as readonly ChildItem[]
}

const addAutoCommandBarTreeYAML = (params: {
  context: ConfigurationContext
  item: ChildItem
  node: FormElementTreeNodeYAML
}): void => {
  const { context, item, node } = params
  const autoCommandBar = getAutoCommandBar(item)
  if (autoCommandBar === undefined) return

  const commandBarYAML = getOrCreateCommandBarYAML({
    context,
    itemType: "AutoCommandBar",
    yaml: node.КоманднаяПанель,
    element: autoCommandBar,
  })

  const commandBarChildItems = getCommandBarChildItems(autoCommandBar)
  const commandBarChildItemsYAML = exportChildItemsToTreeYAML({ context, items: commandBarChildItems })
  if (commandBarChildItemsYAML !== undefined) {
    commandBarYAML.Элементы = commandBarChildItemsYAML
  }

  if (Object.keys(commandBarYAML).length > 0) {
    node.КоманднаяПанель = commandBarYAML
  }
}

const getAutoCommandBar = (item: ChildItem): Record<string, unknown> | undefined => {
  const value = (item as { autoCommandBar?: unknown }).autoCommandBar
  if (!isRecord(value)) return undefined
  return value
}

const getCommandBarChildItems = (autoCommandBar: Record<string, unknown>): readonly ChildItem[] | undefined => {
  const value = autoCommandBar.childItems
  if (!Array.isArray(value)) return undefined
  return value as readonly ChildItem[]
}

const getOrCreateCommandBarYAML = (params: {
  context: ConfigurationContext
  itemType: "AutoCommandBar"
  yaml: unknown
  element: Record<string, unknown>
}): Record<string, unknown> => {
  const { context, itemType, yaml, element } = params
  if (isRecord(yaml)) return { ...yaml }

  const properties = exportElementToYAML({
    context: createFullElementYAMLContext(context),
    element: element as ToMetadata<typeof itemType>,
    rule: getElementRule(itemType),
  }) as Record<string, unknown> | undefined

  return properties ?? {}
}

const importAutoCommandBarFromTreeYAML = (params: {
  context: ConfigurationContext
  node: FormElementTreeNodeYAML
  item: ChildItem & Record<string, unknown>
}): void => {
  const { context, node, item } = params
  const commandBarYAML = node.КоманднаяПанель
  if (commandBarYAML === undefined) return
  if (!isRecord(commandBarYAML)) throw new Error(`Элемент "${item.name}": поле "КоманднаяПанель" должно быть объектом`)

  const importedCommandBar = importElementFromPartialYAML({
    context,
    itemType: "AutoCommandBar",
    yaml: commandBarYAML as ToYAML<"AutoCommandBar">,
    source: { itemType: "AutoCommandBar" } as ToMetadata<"AutoCommandBar">,
  })

  const commandBar = {
    ...importedCommandBar,
    itemType: "AutoCommandBar",
  } as Record<string, unknown>

  const commandBarChildItems = commandBarYAML.Элементы
  if (commandBarChildItems !== undefined) {
    if (!isRecord(commandBarChildItems)) {
      throw new Error(`Элемент "${item.name}": поле "КоманднаяПанель.Элементы" должно быть объектом`)
    }
    commandBar.childItems = importChildItemsFromTreeYAML({
      context,
      yaml: commandBarChildItems,
      propertyType: "CommandBarChildItems",
    })
  }

  item.autoCommandBar = commandBar
}

const getTreeNodeObject = (params: {
  name: string
  node: unknown
}): FormElementTreeNodeYAML => {
  const { name, node } = params
  if (!isRecord(node)) throw new Error(`Элемент "${name}": должен быть объектом`)
  if (typeof node.Вид !== "string") throw new Error(`Элемент "${name}": обязательное поле "Вид" не задано`)
  return node as FormElementTreeNodeYAML
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

const toElementYAML = <Type extends CollectableElementType>(
  _itemType: Type,
  node: FormElementTreeNodeYAML
): ToYAML<Type> => {
  const { Вид: _kind, ...yaml } = node
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

const castImportedChildItems = <To extends readonly ChildItem[]>(items: ChildItem[]): To => {
  return items as unknown as To
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
