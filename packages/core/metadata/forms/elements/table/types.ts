import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { CommandSetYAML } from "~/metadata/forms/commonObjects/commandSet/types"
import { ContextMenuYAML } from "~/metadata/forms/elements/contextMenu/types"

import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { AutoCommandBarYAML } from "../autoCommandBar/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SingleSearchControlAdditionYAML } from "../searchControlAddition/types"
import { SearchStringAdditionYAML } from "../searchStringAddition/types"
import { ViewStatusAdditionYAML } from "../viewStatusAddition/types"
import { TableRules } from "./rules"

export type Table = ElementTypeByRule<typeof TableRules>

export interface TablePartialYAML {
  АвтоВводНезаполненного?: StringboolYAML
  АвтоВводНовойСтроки?: StringboolYAML
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяВысотаВСтрокахТаблицы?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  АвтоОтметкаНезаполненного?: StringboolYAML
  АктивизироватьПоУмолчанию?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВариантУправленияВысотой?: SE.TableHeightControlVariantYAML
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  ВертикальныеЛинии?: StringboolYAML
  Видимость?: StringboolYAML
  Вывод?: SE.UseOutputYAML
  Высота?: number
  ВысотаВСтрокахТаблицы?: number
  ВысотаЗаголовка?: number
  ВысотаПодвала?: number
  ВысотаШапки?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  ГоризонтальныеЛинии?: StringboolYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ЗапросОбновления?: SE.RefreshRequestMethodYAML
  ИзменятьПорядокСтрок?: StringboolYAML
  ИзменятьСоставСтрок?: StringboolYAML
  ИспользованиеТекущейСтроки?: SE.TableCurrentRowUseYAML
  КартинкаСтрок?: PictureYAML
  Команда?: CommandSetYAML
  КоманднаяПанель?: AutoCommandBarYAML
  КонтекстноеМеню?: ContextMenuYAML
  МаксимальнаяВысота?: number
  МаксимальнаяВысотаВСтрокахТаблицы?: number
  МаксимальнаяШирина?: number
  МножественныйВыбор?: StringboolYAML
  НачальноеОтображениеДерева?: SE.InitialTreeViewYAML
  НачальноеОтображениеСписка?: SE.InitialListViewYAML
  ОтметкаНезаполненного?: StringboolYAML
  Отображение?: SE.TableRepresentationYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  ОтображениеСостоянияПросмотра?: ViewStatusAdditionYAML
  ОтображениеСтрокиПоиска?: SearchStringAdditionYAML
  ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorYAML
  ПоведениеПриСжатииПоГоризонтали?: SE.TableBehaviorOnHorizontalCompressionYAML
  Подвал?: StringboolYAML
  Подсказка?: I8nTextYAML
  ПоискПриВводе?: SE.SearchInTableOnInputYAML
  ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
  ПоложениеКоманднойПанели?: SE.FormItemCommandBarLabelLocationYAML
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationYAML
  ПоложениеСтрокиПоиска?: SE.SearchStringLocationYAML
  ПоложениеУправленияПоиском?: SE.SearchControlLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПропускатьПриВводе?: StringboolYAML
  ПутьКДанным?: string
  ПутьКДаннымКартинкиСтроки?: string
  РазрешитьНачалоПеретаскивания?: StringboolYAML
  РазрешитьПеретаскивание?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  РежимВводаСтрок?: SE.TableRowInputModeYAML
  РежимВыбора?: StringboolYAML
  РежимВыделения?: SE.TableSelectionModeYAML
  РежимВыделенияСтроки?: SE.TableRowSelectionModeYAML
  СочетаниеКлавиш?: string
  СпособПеретаскиванияФайлов?: SE.FileDragModeYAML
  ТолькоПросмотр?: StringboolYAML
  УправлениеПоиском?: SingleSearchControlAdditionYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветФона?: ColorYAML
  ЧередованиеЦветовСтрок?: StringboolYAML
  Шапка?: StringboolYAML
  Ширина?: number
  Шрифт?: FontYAML
  ШрифтЗаголовка?: FontYAML
  АвтоОбновление?: StringboolYAML
  ВосстанавливатьТекущуюСтроку?: StringboolYAML
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseYAML
  // ДополнительныеПараметрыСоздания?: StringboolYAML
  ОбновлениеПриИзмененииДанных?: SE.UpdateOnDataChangeYAML
  ОтображатьКорень?: StringboolYAML
  ПериодАвтоОбновления?: number
  РазрешитьВыборКорня?: StringboolYAML
  РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки?: StringboolYAML
  ГруппаПользовательскихНастроек?: string
  События?: {
    Выбор?: string
    ВыборЗначения?: string
    НачалоПеретаскивания?: string
    ОбработкаВыбора?: string
    ОбработкаЗаписиНового?: string
    ОбработкаЗапросаОбновления?: string
    ОкончаниеПеретаскивания?: string
    ПередЗагрузкойПользовательскихНастроекНаСервере: string
    ПередНачаломДобавления?: string
    ПередНачаломИзменения?: string
    ПередОкончаниемРедактирования?: string
    ПередРазворачиванием?: string
    ПередСворачиванием?: string
    ПередУдалением?: string
    Перетаскивание?: string
    ПослеУдаления?: string
    ПриАктивизацииПоля?: string
    ПриАктивизацииСтроки?: string
    ПриАктивизацииЯчейки?: string
    ПриИзменении?: string
    ПриНачалеРедактирования?: string
    ПриОкончанииРедактирования?: string
    ПриСменеТекущегоРодителя?: string
    ПроверкаПеретаскивания?: string
  }
}

export type TableEnterprise = EnterpriseType<typeof TableRules>
