import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importTableChildItemsFromEnterprise } from "~/metadata/forms/collections/tableChildItems/importFromEnterprise"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
} from "~/metadata/forms/elements/columnGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
export function importColumnGroupTypedFromEnterprise<To extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importColumnGroupPropsFromEnterprise(context, data)

  const result: ColumnGroup = {
    ...props,
    elementType: "ColumnGroup",
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importColumnGroupPartialFromEnterprise<To extends ColumnGroup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importColumnGroupPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  const childItems = importTableChildItemsFromEnterprise(context, source.childItems)
  result.childItems = childItems

  return result
}

const importColumnGroupPropsFromEnterprise = (
  context: ConfigurationContext,
  data: ColumnGroupTypedEnterprise | ColumnGroupPartialEnterprise | undefined
): Omit<Partial<ColumnGroup>, "elementType" | "name"> => {
  const result: Omit<Partial<ColumnGroup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    data.Вид,
    SE.FormGroupTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const enableContentChange = importBooleanFromEnterprise(context, data.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const headerHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВШапке,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.headerHorizontalAlign = headerHorizontalAlign

  const group = importSystemEnumerationFromEnterprise<SE.ColumnsGroup>(
    context,
    data.Группировка,
    SE.ColumnsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  const headerPicture = importPictureFromEnterprise(context, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const showInHeader = importBooleanFromEnterprise(context, data.ОтображатьВШапке)
  if (showInHeader !== undefined) result.showInHeader = showInHeader

  const showTitle = importBooleanFromEnterprise(context, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  if (data.ПутьКДаннымШапки !== undefined) result.headerDataPath = data.ПутьКДаннымШапки

  const fixingInTable = importSystemEnumerationFromEnterprise<SE.FixingInTable>(
    context,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  if (data.ФорматШапки !== undefined) result.headerFormat = data.ФорматШапки

  const titleBackColor = importColorFromEnterprise(context, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "ColumnGroup",
  importColumnGroupPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
registerMetadata(
  "ImportTypedFromEnterprise",
  "ColumnGroup",
  importColumnGroupTypedFromEnterprise as ImportTypedFromEnterpriseFn
)
