import { BaseFormElement } from "@/meta/base/baseFormElement"
import { ExplicitUndefined, IInputFieldElement } from "@/meta/forms/interfaces"
import { FormAttributeableMixin } from "@/meta/forms/mixins/formAttributeableMixin"
import { FormNameableMixin } from "@/meta/forms/mixins/formNameableMixin"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { injectable } from "tsyringe"

const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))

@injectable()
export class InputFormElement extends InputFieldElementBase implements IInputFieldElement {
  public title: string = ""
  public height: number = 0
  public multiLine: boolean = false
  public choiceButton: boolean = false
  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  public isMultiline(): boolean {
    return this.multiLine && this.height > 1
  }
}

// import { Expose, Type } from "class-transformer"
// import { TypeDescription, BaseElementWithAttributes } from "./index"
// import { PlainToClassDiscriminator } from "../importer/plainToClassDiscriminator"
// import { elementsManager } from "@/elementsManager"
// import { IAttribute } from "./interfaces"
// import { Attribute } from "./attributes"

// export class InputElement extends BaseElementWithAttributes {
//   public type = "ПолеВвода"
//   public elementType = "ПолеФормы"
//   public elementKind = "ПолеВвода"

//   @Expose({ name: "Значение" })
//   public value: string = ""

//   @Expose({ name: "ОписаниеТипов" })
//   @Type(() => TypeDescription)
//   public typeDescription: TypeDescription = new TypeDescription()

//   public getAttributes(): IAttribute[] {
//     const attributes: IAttribute[] = super.getAttributes()
//     attributes.push(new Attribute(this.attributeId, this.typeDescription))
//     return attributes
//   }

//   protected get defaultId(): string {
//     return "ПолеВвода"
//   }

//   public get isContainer(): boolean {
//     return false
//   }

//   public canBeInOneLine(): boolean {
//     return !this.isMultiline()
//   }

//   public isMultiline(): boolean {
//     const height = this.getProperty("Высота") as number
//     return this.getProperty("МногострочныйРежим") === true && height > 1
//   }
// }

// PlainToClassDiscriminator.addClass(InputElement, "ПолеВвода")

// elementsManager.addElement(InputElement, "InputElement", "ПолеВвода")
