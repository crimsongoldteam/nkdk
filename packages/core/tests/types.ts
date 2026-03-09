import { BaseElement } from "~/metadata/forms/elements/baseElement/types"

export type RequiredFieldsElement<T extends BaseElement> = Omit<Required<T>, "id"> &
  (T extends { events?: any } ? { events: Required<NonNullable<T["events"]>> } : {})
