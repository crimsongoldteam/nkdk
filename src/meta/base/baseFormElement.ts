import { IFormElement, IFormElementProperties } from "../forms/interfaces"

export class BaseFormElementProperties implements IFormElementProperties {}

export class BaseFormElement implements IFormElement {
  public properties: IFormElementProperties = {}
}
