import { BaseElement } from "~/metadata/forms/elements/baseElement/types"

export type RequiredFieldsElement<T extends BaseElement & { events?: any }> = Required<T> & {
  events: Required<NonNullable<T["events"]>>
}
