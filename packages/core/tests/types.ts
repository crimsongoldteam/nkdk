import { BaseElement } from "~/metadata/forms/elements/baseElement/types"

export type RequiredFieldsElement<T extends BaseElement> = Omit<Required<T>, "id" | "selectedText"> &
  (T extends { events?: any } ? { events: Required<NonNullable<T["events"]>> } : {})

export interface StructureResult {
  strings: string[]
  toOneLineGroup: boolean
}
