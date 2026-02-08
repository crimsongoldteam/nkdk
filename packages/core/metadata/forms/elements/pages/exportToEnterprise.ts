import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToYAML,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise } from "~/metadata/forms/elements/pages/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export const exportPagesTypedToEnterprise = <From extends Pages | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportPagesPropsToEnterprise(context, undefined, data)

  const result: PagesTypedEnterprise = {
    Тип: "Страницы",
    ...props,
  }

  const title = exportI8nTextToYAML(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportPagesPartialToEnterprise = <From extends Pages | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportPagesPropsToEnterprise(context, undefined, data)

  const result: PagesPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportPagesPropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: Pages
): PagesPartialEnterprise => {
  const result: PagesPartialEnterprise = {}

  const verticalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemVerticalAlignEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.verticalAlignInGroup
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML<SE.FormGroupTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormGroupType" },
    data.type
  )
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlignInGroup
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const toolTipRepresentation = exportSystemEnumerationToYAML<SE.ToolTipRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ToolTipRepresentation" },
    data.toolTipRepresentation
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const enableContentChange = exportBooleanToEnterprise(context, undefined, data.enableContentChange)
  if (enableContentChange !== undefined) result.РазрешитьИзменениеСостава = enableContentChange

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  if (data.width !== undefined) result.Ширина = data.width

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const currentRowUse = exportSystemEnumerationToYAML<SE.CurrentRowUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CurrentRowUse" },
    data.currentRowUse
  )
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  // const associatedTable = exportTableToEnterprise(context, undefined, data.associatedTable)
  // if (associatedTable !== undefined) result.ИспользуемаяТаблица = associatedTable

  const pagesRepresentation = exportSystemEnumerationToYAML<SE.FormPagesRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormPagesRepresentation" },
    data.pagesRepresentation
  )
  if (pagesRepresentation !== undefined) result.ОтображениеСтраниц = pagesRepresentation

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const currentPagesState = exportSystemEnumerationToYAML<SE.FormPagesStateEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormPagesState" },
    data.currentPagesState
  )
  if (currentPagesState !== undefined) result.ТекущееСостояниеСтраниц = currentPagesState

  const events = exportEventsToEnterprise(context, undefined, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "Pages", exportPagesPartialToEnterprise as ExportPartialToEnterpriseFn)
