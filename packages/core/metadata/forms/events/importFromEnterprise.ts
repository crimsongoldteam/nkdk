import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Events, EventsEnterprise } from "./types"

const enterpriseEventNameMapping: Record<string, string> = {
  ПриИзменении: "onChange",
  АвтоПодбор: "autoComplete",
  ДобавлениеМножественныхЗначений: "multipleValuesAdd",
  ИзменениеТекстаРедактирования: "editTextChange",
  НачалоВыбора: "startChoice",
  НачалоВыбораИзСписка: "startListChoice",
  ОбработкаВыбора: "choiceProcessing",
  ОбработкаНавигационнойСсылкиМножественногоЗначения: "multipleValueURLProcessing",
  ОбработкаФормированияКоманд: "commandGenerateProcessing",
  ОкончаниеВводаТекста: "textEditEnd",
  Открытие: "opening",
  ОткрытиеМножественногоЗначения: "multipleValueOpening",
  Очистка: "clearing",
  Регулирование: "tuning",
  Создание: "creating",
  УдалениеМножественныхЗначений: "multipleValuesDelete",
  ПриСменеСтраницы: "onCurrentPageChange",
  Выбор: "selection",
  НачалоПеретаскивания: "dragStart",
  ОкончаниеПеретаскивания: "dragEnd",
  Перетаскивание: "drag",
  ПриАктивизацииДаты: "onActivateDate",
  ПриВыводеПериода: "onPeriodOutput",
  ПроверкаПеретаскивания: "dragCheck",
  Нажатие: "click",
  ОбработкаНавигационнойСсылки: "uRLProcessing",
  ОбработкаРасшифровки: "detailProcessing",
  ПередРазворачиванием: "beforeExpand",
  ПередСворачиванием: "beforeCollapse",
  ПриАктивизацииЗначения: "onActivateValue",
  ПриАктивизацииИнтервала: "onActivateInterval",
  ПриОкончанииРедактированияИнтервала: "onIntervalEditEnd",
  ПередЗаписью: "beforeWrite",
  ПередПечатью: "beforePrint",
  ПослеЗаписи: "afterWrite",
  ПриАктивизации: "onActivate",
  НажатиеНаДействиеПланировщика: "plannerActionClick",
  НажатиеНаНавигационнойСсылке: "uRLClick",
  НажатиеНаПеренесенномЗаголовкеШкалыВремени: "wrappedTimeScaleHeaderClick",
  НажатиеНаЭлементеИзмерения: "dimensionItemClick",
  НажатиеНаЭлементеШкалыВремени: "timeScaleItemClick",
  ПередНачаломБыстрогоРедактирования: "beforeStartQuickEdit",
  ПередНачаломРедактирования: "beforeStartEdit",
  ПередРазворачиваниемЭлементаИзмерения: "beforeExpandDimensionItem",
  ПередСворачиваниемЭлементаИзмерения: "beforeCollapseDimensionItem",
  ПередСозданием: "beforeCreate",
  ПередУдалением: "beforeDelete",
  ПриОкончанииРедактирования: "onEditEnd",
  ПриСменеТекущегоПериодаОтображения: "onCurrentRepresentationPeriodChange",
  ПроверкаПеретаскиванияВнутри: "insideDragCheck",
  ДокументСформирован: "documentComplete",
  ПриНажатии: "onClick",
  ОбработкаДополнительнойРасшифровки: "additionalDetailProcessing",
  ПриИзмененииСодержимогоОбласти: "onChangeAreaContentEvent",
}

export const importEventsFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: EventsEnterprise | undefined
): Events | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const result: Events = {}

  for (const [enterpriseEventName, eventValue] of Object.entries(data)) {
    const eventName = enterpriseEventNameMapping[enterpriseEventName]
    if (eventName) {
      result[eventName] = eventValue
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}
