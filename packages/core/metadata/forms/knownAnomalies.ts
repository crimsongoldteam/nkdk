type XMLObject = Record<string, unknown>

export const ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM =
  "Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml"

export const MASTER_SIMPLIFIED_CONNECTION_FORM =
  "DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/МастерФормированияЗаявкиНаПодключениеУпрощенное/Ext/Form.xml"

export const restoreKnownDuplicateErpAdditionalColumns = <ColumnXML extends XMLObject>(params: {
  currentXMLPath: string | undefined
  table: string
  columnName: string | undefined
  columnsCount: number
  column: ColumnXML | undefined
}): ColumnXML[] | undefined => {
  const { currentXMLPath, table, columnName, columnsCount, column } = params
  if (column === undefined) return undefined
  if (!isKnownXMLPath(currentXMLPath, ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM)) return undefined
  if (table !== "Список.Способы") return undefined
  if (columnName !== "Реквизит1") return undefined
  if (columnsCount !== 1) return undefined

  return ["1", "2", "3", "4", "5"].map((id) => ({
    ...column,
    _id: id,
  }))
}

const KNOWN_MASTER_BUTTON_IDS = [
  { name: "ЕстьКЭП", buttonId: "1823", tooltipId: "1825" },
  { name: "НетКЭП", buttonId: "1824", tooltipId: "1826" },
  { name: "ЕстьКЭП", buttonId: "1314", tooltipId: "1315" },
  { name: "НетКЭП", buttonId: "1316", tooltipId: "1317" },
] as const

export const restoreKnownDuplicateCommandBarButtonIds = <ItemXML extends XMLObject>(params: {
  currentXMLPath: string | undefined
  items: ItemXML[]
}): ItemXML[] => {
  const { currentXMLPath, items } = params
  if (!isKnownXMLPath(currentXMLPath, MASTER_SIMPLIFIED_CONNECTION_FORM)) return items
  if (!isKnownMasterButtonSequence(items)) return items

  return items.map((item, index) => {
    const commandBarButton = (item as XMLObject).CommandBarButton
    if (!isXMLObject(commandBarButton)) return item

    const ids = KNOWN_MASTER_BUTTON_IDS[index]
    const nextButton: XMLObject = {
      ...commandBarButton,
      _id: ids.buttonId,
    }

    if (isXMLObject(commandBarButton.ExtendedTooltip)) {
      nextButton.ExtendedTooltip = {
        ...commandBarButton.ExtendedTooltip,
        _id: ids.tooltipId,
      }
    }

    return {
      ...item,
      CommandBarButton: nextButton,
    }
  }) as ItemXML[]
}

export const findKnownDuplicateCommandBarButtonReference = <Item extends { itemType?: string; name?: string }>(params: {
  currentXMLPath: string | undefined
  items: readonly Item[]
  referenceItems: readonly Item[] | undefined
  index: number
}): Item | undefined => {
  const { currentXMLPath, items, referenceItems, index } = params
  if (!isKnownXMLPath(currentXMLPath, MASTER_SIMPLIFIED_CONNECTION_FORM)) return undefined
  if (referenceItems === undefined) return undefined
  if (!isKnownMasterButtonDataSequence(items)) return undefined
  if (!isKnownMasterButtonDataSequence(referenceItems)) return undefined

  return referenceItems[index]
}

const isKnownMasterButtonSequence = (items: XMLObject[]): boolean => {
  if (items.length !== KNOWN_MASTER_BUTTON_IDS.length) return false

  return items.every((item, index) => {
    const commandBarButton = item.CommandBarButton
    if (!isXMLObject(commandBarButton)) return false
    if (commandBarButton._name !== KNOWN_MASTER_BUTTON_IDS[index].name) return false
    return isXMLObject(commandBarButton.ExtendedTooltip)
  })
}

const isKnownMasterButtonDataSequence = <Item extends { itemType?: string; name?: string }>(items: readonly Item[]): boolean => {
  if (items.length !== KNOWN_MASTER_BUTTON_IDS.length) return false

  return items.every((item, index) => {
    return item.itemType === "CommandBarButton" && item.name === KNOWN_MASTER_BUTTON_IDS[index].name
  })
}

const isXMLObject = (value: unknown): value is XMLObject => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const isKnownXMLPath = (currentXMLPath: string | undefined, knownXMLPath: string): boolean => {
  if (currentXMLPath === undefined) return false

  const normalizedPath = currentXMLPath.replaceAll("\\", "/")
  return normalizedPath === knownXMLPath || normalizedPath.endsWith(`/${knownXMLPath}`)
}
