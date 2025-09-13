import { BaseElementWithoutAttributes } from "./baseElementWithoutAttributes"
import { PlainToClassDiscriminator } from "../importer/plainToClassDiscriminator"
import { elementsManager } from "@/elementsManager"

export class LabelElement extends BaseElementWithoutAttributes {
  public type = "Надпись"
  public elementType = "ДекорацияФормы"
  public elementKind = "Надпись"

  protected get defaultId(): string {
    return "Надпись"
  }

  public get isContainer(): boolean {
    return false
  }

  public canBeInOneLine(): boolean {
    return true
  }
}

PlainToClassDiscriminator.addClass(LabelElement, "Надпись")

elementsManager.addElement(LabelElement, "LabelElement", "Надпись")
