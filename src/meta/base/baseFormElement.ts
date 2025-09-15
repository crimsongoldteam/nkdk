import { IFormElementProperties } from "../forms/interfaces"
import { IFormElement } from "@/elements/interfaces"

export class BaseFormElementProperties implements IFormElementProperties {}

export class BaseFormElement implements IFormElement {
  public properties: IFormElementProperties = {}
}
