import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorPreview } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontPreview } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PicturePreview } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { BaseElementPropsEnterprise, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface Button extends NamedElement {
  elementType: "Button"
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  check?: boolean
  commandName?: string
  commandUniqueness?: boolean
  defaultButton?: boolean
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  font?: Font
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  locationInCommandBar?: SE.ButtonLocationInCommandBar
  maxHeight?: number
  maxWidth?: number
  onMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
  onlyInAllActions?: boolean
  picture?: Picture
  pictureLocation?: SE.FormButtonPictureLocation
  representation?: SE.ButtonRepresentation
  representationInContextMenu?: SE.ButtonLocationInContextMenu
  shape?: SE.ButtonShape
  shapeRepresentation?: SE.ButtonShapeRepresentation
  skipOnInput?: boolean
  textColor?: Color
  title?: I8nText
  titleHeight?: number
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormButtonType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
}

export interface ButtonPartialEnterprise extends BaseElementPropsEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormButtonTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ВысотаЗаголовка?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ИмяКоманды?: string
  Картинка?: PictureEnterprise
  КнопкаПоУмолчанию?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Отображение?: SE.ButtonRepresentationEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  ОтображениеВКонтекстномМеню?: SE.ButtonLocationInContextMenuEnterprise
  ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorEnterprise
  ПоложениеВКоманднойПанели?: SE.ButtonLocationInCommandBarEnterprise
  ПоложениеКартинки?: SE.FormButtonPictureLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Пометка?: StringboolEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  ТолькоВоВсехДействиях?: StringboolEnterprise
  УникальностьКоманды?: StringboolEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}

export interface ButtonTypedEnterprise extends ButtonPartialEnterprise {
  Тип: "Кнопка"
}

export interface ButtonPreview {
  Name: string
  ElementType: "FormButton"
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorPreview
  BorderColor?: ColorPreview
  Check?: boolean
  CommandName?: string
  CommandUniqueness?: boolean
  DefaultButton?: boolean
  DefaultItem?: boolean
  DisplayImportance?: SE.SystemEnumerationPreview
  Enabled?: boolean
  // ExtendedTooltip?: ExtendedTooltipPreview
  Font?: FontPreview
  Height?: number
  HorizontalAlignInGroup?: SE.SystemEnumerationPreview
  HorizontalStretch?: boolean
  LocationInCommandBar?: SE.SystemEnumerationPreview
  MaxHeight?: number
  MaxWidth?: number
  OnMainServerUnavalableBehavior?: SE.SystemEnumerationPreview
  OnlyInAllActions?: boolean
  Picture?: PicturePreview
  PictureLocation?: SE.SystemEnumerationPreview
  Representation?: SE.SystemEnumerationPreview
  Shape?: SE.SystemEnumerationPreview
  ShapeRepresentation?: SE.SystemEnumerationPreview
  SkipOnInput?: boolean
  TextColor?: ColorPreview
  Title?: string
  TitleHeight?: number
  ToolTipRepresentation?: SE.SystemEnumerationPreview
  Type?: SE.SystemEnumerationPreview
  VerticalAlignInGroup?: SE.SystemEnumerationPreview
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
}
