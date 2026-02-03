import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importFormattedI8nTextCombinedFromEnterprise,
  importFormattedI8nTextFromEnterprise,
} from "~/metadata/commonObjects/formattedI8nText/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import {
  importPictureCombinedFromEnterprise,
  importPictureFromEnterprise,
} from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
} from "~/metadata/forms/elements/pictureDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"

const importPictureDecorationEventsFromEnterprise = (
  data:
    | {
        Нажатие?: string
        НачалоПеретаскивания?: string
        ОкончаниеПеретаскивания?: string
        Перетаскивание?: string
        ПроверкаПеретаскивания?: string
      }
    | undefined
):
  | {
      click?: string
      dragStart?: string
      dragEnd?: string
      drag?: string
      dragCheck?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    click?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    dragCheck?: string
  } = {}

  if (data.Нажатие !== undefined) result.click = data.Нажатие
  if (data.НачалоПеретаскивания !== undefined) result.dragStart = data.НачалоПеретаскивания
  if (data.ОкончаниеПеретаскивания !== undefined) result.dragEnd = data.ОкончаниеПеретаскивания
  if (data.Перетаскивание !== undefined) result.drag = data.Перетаскивание
  if (data.ПроверкаПеретаскивания !== undefined) result.dragCheck = data.ПроверкаПеретаскивания

  return Object.keys(result).length > 0 ? result : undefined
}

export function importPictureDecorationTypedFromEnterprise<To extends PictureDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importPictureDecorationPropsFromEnterprise(context, undefined, data)

  const result: PictureDecoration = {
    ...props,
    elementType: "PictureDecoration",
    name,
  }

  const title = importFormattedI8nTextFromEnterprise(context, undefined, data.Заголовок, data.ФорматированныйЗаголовок)
  if (title !== undefined) result.title = title

  const picture = importPictureFromEnterprise(context, undefined, data.Картинка)
  if (picture !== undefined) result.picture = picture

  return result as To
}

export function importPictureDecorationPartialFromEnterprise<To extends PictureDecoration>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importPictureDecorationPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
  }

  const title = importFormattedI8nTextCombinedFromEnterprise(
    context,
    source.title,
    data?.Заголовок,
    data?.ФорматированныйЗаголовок
  )
  if (title !== undefined) result.title = title

  const picture = importPictureCombinedFromEnterprise(context, undefined, source.picture, data?.Картинка)
  if (picture !== undefined) result.picture = picture

  return result
}

const importPictureDecorationPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PictureDecorationTypedEnterprise | PictureDecorationPartialEnterprise | undefined
): Omit<Partial<PictureDecoration>, "elementType" | "name"> => {
  const result: Omit<Partial<PictureDecoration>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromYAML<SE.FormDecorationType>(
    context,
    undefined,
    data.Вид,
    SE.FormDecorationTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const contextMenu = importContextMenuFromEnterprise(context, undefined, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const skipOnInput = importBooleanFromEnterprise(context, undefined, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  const hyperlink = importBooleanFromEnterprise(context, undefined, data.Гиперссылка)
  if (hyperlink !== undefined) result.hyperlink = hyperlink

  // const picture = importPictureFromEnterprise(context, undefined, data.Картинка)
  // if (picture !== undefined) result.picture = picture

  if (data.Масштаб !== undefined) result.scale = data.Масштаб

  const zoomable = importBooleanFromEnterprise(context, undefined, data.Масштабировать)
  if (zoomable !== undefined) result.zoomable = zoomable

  const pictureSize = importSystemEnumerationFromYAML<SE.PictureSize>(
    context,
    undefined,
    data.РазмерКартинки,
    SE.PictureSizeFromEnterprise
  )
  if (pictureSize !== undefined) result.pictureSize = pictureSize

  const enableStartDrag = importBooleanFromEnterprise(context, undefined, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, undefined, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const border = importBorderFromEnterprise(context, undefined, data.Рамка)
  if (border !== undefined) result.border = border

  const fileDragMode = importSystemEnumerationFromYAML<SE.FileDragMode>(
    context,
    undefined,
    data.СпособПеретаскиванияФайлов,
    SE.FileDragModeFromEnterprise
  )
  if (fileDragMode !== undefined) result.fileDragMode = fileDragMode

  if (data.ТекстНевыбраннойКартинки !== undefined) result.nonselectedPictureText = data.ТекстНевыбраннойКартинки

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const events = importPictureDecorationEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "PictureDecoration",
  importPictureDecorationPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
