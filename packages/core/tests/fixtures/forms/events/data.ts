import { Events } from "~/metadata/orchestration/event/types"

export const singleEvent: Events = {
  click: "РаспознаваниеДокументаНадписьНажатие",
}

export const multipleEvents: Events = {
  onChange: "ОбработкаИзменения",
  opening: "ПроцедураОткрытия",
}
