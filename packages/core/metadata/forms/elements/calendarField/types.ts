import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { CalendarFieldRules } from "./rules"

export type CalendarField = ElementTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldPartialYAML = YAMLTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldEnterprise = EnterpriseType<typeof CalendarFieldRules>

// export interface CalendarField extends NamedElement {
//   itemType: "CalendarField"
//   autoMaxHeight?: boolean
//   autoMaxWidth?: boolean
//   beginOfRepresentationPeriod?: string
//   border?: Border
//   borderColor?: Color
//   calendarNavigation?: boolean
//   enableDrag?: boolean
//   enableStartDrag?: boolean
//   endOfRepresentationPeriod?: string
//   font?: Font
//   height?: number
//   heightInMonths?: number
//   horizontalStretch?: boolean
//   maxHeight?: number
//   maxWidth?: number
//   selectionMode?: SE.DateSelectionMode
//   showCurrentDate?: boolean
//   showMonthsPanel?: boolean
//   verticalStretch?: boolean
//   width?: number
//   widthInMonths?: number
//   autoCellHeight?: boolean
//   cellHyperlink?: boolean
//   contextMenu?: ContextMenu
//   dataPath?: string
//   defaultItem?: boolean
//   displayImportance?: SE.displayImportance
//   enabled?: boolean
//   extendedTooltip?: ExtendedTooltip
//   horizontalAlignInGroup?: SE.ItemHorizontalLocation
//   readOnly?: boolean
//   shortcut?: string
//   skipOnInput?: boolean
//   title?: I8nText
//   titleFont?: Font
//   titleHeight?: number
//   titleLocation?: SE.FormItemTitleLocation
//   titleTextColor?: Color
//   toolTip?: I8nText
//   toolTipRepresentation?: SE.ToolTipRepresentation
//   userVisible?: UserVisible
//   verticalAlignInGroup?: SE.ItemVerticalAlign
//   visible?: boolean
//   warningOnEdit?: I8nText
//   warningOnEditRepresentation?: SE.WarningOnEditRepresentation
//   onMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
//   events?: {
//     onChange?: string
//     selection?: string
//     dragStart?: string
//     dragEnd?: string
//     drag?: string
//     onActivateDate?: string
//     onPeriodOutput?: string
//     dragCheck?: string
//   }
// }

// export interface CalendarFieldPartialYAML {
//   АвтоВысотаЯчейки?: StringboolYAML
//   АктивизироватьПоУмолчанию?: StringboolYAML
//   АвтоМаксимальнаяВысота?: StringboolYAML
//   АвтоМаксимальнаяШирина?: StringboolYAML
//   ВажностьПриОтображении?: SE.DisplayImportanceYAML
//   ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
//   Видимость?: StringboolYAML
//   Высота?: number
//   ВысотаВМесяцах?: number
//   ВысотаЗаголовка?: number
//   ГиперссылкаЯчейки?: StringboolYAML
//   ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
//   Доступность?: StringboolYAML
//   Заголовок?: I8nTextYAML
//   КонецПериодаОтображения?: string
//   КонтекстноеМеню?: ContextMenuYAML
//   МаксимальнаяВысота?: number
//   МаксимальнаяШирина?: number
//   НачалоПериодаОтображения?: string
//   ОтображатьПанельМесяцев?: StringboolYAML
//   ОтображатьТекущуюДату?: StringboolYAML
//   ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
//   ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationYAML
//   ПеремещениеПоКалендарю?: StringboolYAML
//   Подсказка?: I8nTextYAML
//   ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
//   ПредупреждениеПриРедактировании?: I8nTextYAML
//   ПропускатьПриВводе?: StringboolYAML
//   ПутьКДанным?: string
//   РасширеннаяПодсказка?: ExtendedTooltipYAML
//   РазрешитьНачалоПеретаскивания?: StringboolYAML
//   РазрешитьПеретаскивание?: StringboolYAML
//   РазрешитьИспользование?: UserVisibleYAML
//   ЗапретитьИспользование?: UserVisibleYAML
//   Рамка?: BorderYAML
//   РастягиватьПоВертикали?: StringboolYAML
//   РастягиватьПоГоризонтали?: StringboolYAML
//   РежимВыделения?: SE.DateSelectionModeYAML
//   СочетаниеКлавиш?: string
//   ТолькоПросмотр?: StringboolYAML
//   ЦветРамки?: ColorYAML
//   ЦветТекстаЗаголовка?: ColorYAML
//   Ширина?: number
//   ШиринаВМесяцах?: number
//   Шрифт?: FontYAML
//   ШрифтЗаголовка?: FontYAML
//   ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorYAML
//   События?: {
//     ПриИзменении?: string
//     Выбор?: string
//     НачалоПеретаскивания?: string
//     ОкончаниеПеретаскивания?: string
//     Перетаскивание?: string
//     ПриАктивизацииДаты?: string
//     ПриВыводеПериода?: string
//     ПроверкаПеретаскивания?: string
//   }
// }
