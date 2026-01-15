import { ConfigurationContext } from "../../context/types"
import { Events, EventsEnterprise } from "./types"

const eventNameMapping: Record<string, string> = {
  onChange: "ПриИзменении",
  autoComplete: "АвтоПодбор",
  multipleValuesAdd: "ДобавлениеМножественныхЗначений",
  editTextChange: "ИзменениеТекстаРедактирования",
  startChoice: "НачалоВыбора",
  startListChoice: "НачалоВыбораИзСписка",
  choiceProcessing: "ОбработкаВыбора",
  multipleValueURLProcessing: "ОбработкаНавигационнойСсылкиМножественногоЗначения",
  commandGenerateProcessing: "ОбработкаФормированияКоманд",
  textEditEnd: "ОкончаниеВводаТекста",
  opening: "Открытие",
  multipleValueOpening: "ОткрытиеМножественногоЗначения",
  clearing: "Очистка",
  tuning: "Регулирование",
  creating: "Создание",
  multipleValuesDelete: "УдалениеМножественныхЗначений",
  beforeWrite: "ПередЗаписью",
  beforePrint: "ПередПечатью",
  afterWrite: "ПослеЗаписи",
  onCurrentPageChange: "ПриСменеСтраницы",
  selection: "Выбор",
  click: "Нажатие",
  uRLProcessing: "ОбработкаНавигационнойСсылки",
  uRLClick: "НажатиеНаНавигационнойСсылке",
  detailProcessing: "ОбработкаРасшифровки",
  beforeExpand: "ПередРазворачиванием",
  beforeCollapse: "ПередСворачиванием",
  onActivateValue: "ПриАктивизацииЗначения",
  onActivateInterval: "ПриАктивизацииИнтервала",
  onIntervalEditEnd: "ПриОкончанииРедактированияИнтервала",
  dragStart: "НачалоПеретаскивания",
  dragEnd: "ОкончаниеПеретаскивания",
  drag: "Перетаскивание",
  dragCheck: "ПроверкаПеретаскивания",
  additionalDetailProcessing: "ОбработкаДополнительнойРасшифровки",
  onActivate: "ПриАктивизации",
  onChangeAreaContentEvent: "ПриИзмененииСодержимогоОбласти",
}

export const exportEventsToEnterprise = (
  _context: ConfigurationContext,
  data: Events | undefined
): EventsEnterprise | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const result: EventsEnterprise = {}

  for (const [eventName, eventValue] of Object.entries(data)) {
    const enterpriseEventName = eventNameMapping[eventName]
    if (enterpriseEventName) {
      result[enterpriseEventName] = eventValue
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}
