import { Context } from "../../context/types"
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
}

export const importEventsFromEnterprise = (
  _context: Context,
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
