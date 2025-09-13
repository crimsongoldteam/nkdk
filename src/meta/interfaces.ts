import { IManagedFormElement } from "./forms/interfaces"

export interface MetaObject {
  formObject: FormObject
}

export interface FormObject {
  element: IManagedFormElement
}
