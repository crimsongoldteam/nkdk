import { Expose, Type } from "class-transformer"
import { IAttribute, ITypeDescription } from "./interfaces"
import { TypeDescription } from "./typeDescription"
import { PropertiesFormatter } from "@/formatter/propertiesFormatter"

export class Attribute implements IAttribute {
  @Expose({ name: "Имя" })
  name: string

  @Expose({ name: "ОписаниеТипов" })
  typeDescription: TypeDescription

  @Expose({ name: "ЭтоТаблица" })
  isTable: boolean = false

  @Expose({ name: "ЭтоНовый" })
  isNew: boolean = false

  @Expose({ name: "ОдиночныйТип" })
  singleTypeDescription: string = ""

  @Expose({ name: "Значения" })
  @Type(() => Attribute)
  items?: IAttribute[]

  constructor(name: string, typeDescription: ITypeDescription) {
    this.name = name
    this.typeDescription = typeDescription

    this.isTable = typeDescription.isTable()
    this.isNew = typeDescription.isNew

    this.singleTypeDescription = PropertiesFormatter.formatTypeDescription(typeDescription)
  }
}
