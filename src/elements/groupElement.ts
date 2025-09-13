import { Expose, Transform, Type } from "class-transformer"
import { BaseElement } from "./baseElement"
import { ElementListType } from "./types"
import { BaseElementWithoutAttributes } from "./baseElementWithoutAttributes"
import { PlainToClassDiscriminator } from "../importer/plainToClassDiscriminator"
import { PlainToClassTransformer } from "../importer/plaintToClassTransformer"
import { elementsManager } from "@/elementsManager"
import { FormGroupType } from "@/metadata/interface"
import { IGroupElement } from "@/elements/interfaces"

export class GroupElement extends BaseElementWithoutAttributes implements IGroupElement {
  public type = "ОбычнаяГруппа"
  public elementType = "ГруппаФормы"
  public elementKind = FormGroupType.UsualGroup

  @Expose({ name: "Элементы" })
  @Type(() => BaseElement, PlainToClassDiscriminator.discriminatorOptions)
  @Transform(PlainToClassTransformer.transform, { toClassOnly: true })
  public items: BaseElement[] = []

  public get group(): string | undefined {
    return this.getProperty("Группировка") as string | undefined
  }

  public set group(value: string | undefined) {
    this.setProperty("Группировка", value)
  }

  public static readonly childrenFields = [ElementListType.Items]

  protected get defaultId(): string {
    return "Группа"
  }

  public get isContainer(): boolean {
    return true
  }

  public isOneLineGroup(): boolean {
    if (this.group !== "Горизонтальная") {
      return false
    }

    for (const item of this.items) {
      if (!item.canBeInOneLine()) {
        return false
      }
    }

    return true
  }

  public canShrink(): boolean {
    if (this.items.length !== 1) return false

    if (this.hasSignificantProperties()) return false

    return true
  }

  private hasSignificantProperties(): boolean {
    for (const [key, _property] of this.properties) {
      if (key == "Группировка") {
        continue
      }

      return true
    }
    return false
  }

  public canBeInOneLine(): boolean {
    return false
  }

  public isNeedGroupWrap(): boolean {
    return false
  }
}

PlainToClassDiscriminator.addClass(GroupElement, "ОбычнаяГруппа")

elementsManager.addElement(GroupElement, "GroupElement", "ОбычнаяГруппа")
