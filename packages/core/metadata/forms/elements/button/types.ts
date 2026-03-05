import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ButtonRules } from "./rules"

export type Button = ElementTypeByRule<typeof ButtonRules>

// export interface ButtonOld extends NamedElement {
//   itemType: "Button"
//   autoMaxHeight?: boolean
//   autoMaxWidth?: boolean
//   backColor?: Color
//   borderColor?: Color
//   check?: boolean
//   commandName?: string
//   commandUniqueness?: boolean
//   defaultButton?: boolean
//   defaultItem?: boolean
//   displayImportance?: SE.DisplayImportance
//   enabled?: boolean
//   extendedTooltip?: ExtendedTooltip
//   font?: Font
//   height?: number
//   horizontalAlignInGroup?: SE.ItemHorizontalLocation
//   horizontalStretch?: boolean
//   locationInCommandBar?: SE.ButtonLocationInCommandBar
//   maxHeight?: number
//   maxWidth?: number
//   onMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
//   onlyInAllActions?: boolean
//   picture?: Picture
//   pictureLocation?: SE.FormButtonPictureLocation
//   representation?: SE.ButtonRepresentation
//   representationInContextMenu?: SE.ButtonLocationInContextMenu
//   shape?: SE.ButtonShape
//   shapeRepresentation?: SE.ButtonShapeRepresentation
//   skipOnInput?: boolean
//   textColor?: Color
//   title?: I8nText
//   titleHeight?: number
//   toolTipRepresentation?: SE.ToolTipRepresentation
//   type?: SE.FormButtonType
//   userVisible?: UserVisible
//   verticalAlignInGroup?: SE.ItemVerticalAlign
//   verticalStretch?: boolean
//   visible?: boolean
//   width?: number
// }

export type ButtonPartialYAML = YAMLTypeByRule<typeof ButtonRules>

// export interface ButtonPartialYAML extends BaseElementPropsYAML {
//   АвтоМаксимальнаяВысота?: StringboolYAML
//   АвтоМаксимальнаяШирина?: StringboolYAML
//   АктивизироватьПоУмолчанию?: StringboolYAML
//   ВажностьПриОтображении?: SE.DisplayImportanceYAML
//   ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
//   Вид?: SE.FormButtonTypeYAML
//   Видимость?: StringboolYAML
//   Высота?: number
//   ВысотаЗаголовка?: number
//   ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
//   Доступность?: StringboolYAML
//   Заголовок?: I8nTextYAML
//   ИмяКоманды?: string
//   Картинка?: PictureYAML
//   КнопкаПоУмолчанию?: StringboolYAML
//   МаксимальнаяВысота?: number
//   МаксимальнаяШирина?: number
//   Отображение?: SE.ButtonRepresentationYAML
//   ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
//   ОтображениеФигуры?: SE.ButtonShapeRepresentationYAML
//   ОтображениеВКонтекстномМеню?: SE.ButtonLocationInContextMenuYAML
//   ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorYAML
//   ПоложениеВКоманднойПанели?: SE.ButtonLocationInCommandBarYAML
//   ПоложениеКартинки?: SE.FormButtonPictureLocationYAML
//   РазрешитьИспользование?: UserVisibleYAML
//   ЗапретитьИспользование?: UserVisibleYAML
//   Пометка?: StringboolYAML
//   ПропускатьПриВводе?: StringboolYAML
//   РастягиватьПоВертикали?: StringboolYAML
//   РастягиватьПоГоризонтали?: StringboolYAML
//   РасширеннаяПодсказка?: ExtendedTooltipYAML
//   ТолькоВоВсехДействиях?: StringboolYAML
//   УникальностьКоманды?: StringboolYAML
//   Фигура?: SE.ButtonShapeYAML
//   ЦветРамки?: ColorYAML
//   ЦветТекста?: ColorYAML
//   ЦветФона?: ColorYAML
//   Ширина?: number
//   Шрифт?: FontYAML
// }

export interface ButtonTypedYAML extends ButtonPartialYAML {
  Тип: "Кнопка"
}

export type ButtonEnterprise = EnterpriseType<typeof ButtonRules>
