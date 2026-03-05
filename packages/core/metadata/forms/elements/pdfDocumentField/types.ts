import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { PDFDocumentFieldRules } from "./rules"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"

export type PDFDocumentField = ElementTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldPartialYAML = YAMLTypeByRule<typeof PDFDocumentFieldRules>

// export interface PDFDocumentFieldPartialYAML {
//   АвтоМаксимальнаяВысота?: StringboolYAML
//   АвтоМаксимальнаяШирина?: StringboolYAML
//   Вывод?: SE.UseOutputYAML
//   Высота?: number
//   ИспользуемоеИмяФайла?: string
//   МаксимальнаяВысота?: number
//   МаксимальнаяШирина?: number
//   Масштаб?: number
//   НомерТекущейСтраницы?: number
//   Ориентация?: number
//   ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationYAML
//   РазрешитьИспользование?: UserVisibleYAML
//   ЗапретитьИспользование?: UserVisibleYAML
//   РастягиватьПоВертикали?: StringboolYAML
//   РастягиватьПоГоризонтали?: StringboolYAML
//   ЦветРамки?: ColorYAML
//   Ширина?: number
//   События?: {
//     ПриИзменении?: string
//     НажатиеНаНавигационнойСсылке?: string
//   }
//   АвтоВысотаЯчейки?: StringboolYAML
//   АктивизироватьПоУмолчанию?: StringboolYAML
//   ВажностьПриОтображении?: SE.DisplayImportanceYAML
//   ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
//   ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
//   Вид?: SE.FormFieldTypeYAML
//   Видимость?: StringboolYAML
//   ВысотаЗаголовка?: number
//   ГиперссылкаЯчейки?: StringboolYAML
//   ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
//   ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
//   ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationYAML
//   ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationYAML
//   Доступность?: StringboolYAML
//   Заголовок?: I8nTextYAML
//   КартинкаПодвала?: PictureYAML
//   КартинкаШапки?: PictureYAML
//   КонтекстноеМеню?: ContextMenuYAML
//   ОграничениеТипа?: TypeDescriptionYAML
//   ОтображатьВПодвале?: StringboolYAML
//   ОтображатьВШапке?: StringboolYAML
//   ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
//   ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationYAML
//   Подсказка?: I8nTextYAML
//   ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
//   ПредупреждениеПриРедактировании?: I8nTextYAML
//   ПропускатьПриВводе?: StringboolYAML
//   ПутьКДанным?: string
//   ПутьКДаннымПодвала?: string
//   РасширеннаяПодсказка?: ExtendedTooltipYAML
//   РежимРедактирования?: SE.ColumnEditModeYAML
//   СочетаниеКлавиш?: string
//   Таблица?: string
//   ТекстПодвала?: I8nTextYAML
//   ТолькоПросмотр?: StringboolYAML
//   ФиксацияВТаблице?: SE.FixingInTableYAML
//   ЦветТекстаЗаголовка?: ColorYAML
//   ЦветТекстаПодвала?: ColorYAML
//   ЦветФонаЗаголовка?: ColorYAML
//   ЦветФонаПодвала?: ColorYAML
//   ШрифтЗаголовка?: FontYAML
//   ШрифтПодвала?: FontYAML
// }

export type PDFDocumentFieldEnterprise = EnterpriseType<typeof PDFDocumentFieldRules>
