import { BaseElement } from "~/metadata/forms/elements/baseElement/types"

export type RequiredFieldsElement<T extends BaseElement> = Omit<Required<T>, "id" | "userVisible"> &
  (T extends { userVisible?: any } ? { userVisible?: T["userVisible"] } : {}) &
  (T extends { events?: any } ? { events: Required<NonNullable<T["events"]>> } : {})
