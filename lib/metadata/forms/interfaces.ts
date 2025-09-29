// import * as SystemEnumeration from "@/metadata/systemEnumerations"
// import React from "react"
// import { IFormatterParams } from "../../formatter/types"

// export interface IFormElement {
//   get XMLExporterToken(): symbol
//   get formatterToken(): symbol
//   get HTMLExportRulesToken(): symbol
// }

// export interface IFormElementProperties {
//   name?: string
// }

// export enum DateFractions {
//   Time = "Время",
//   Date = "Дата",
//   DateTime = "ДатаВремя",
// }

// export interface ITypeDescription {
//   types: string[]
//   digits: number
//   fractionDigits: number
//   length: number
//   dateFractions: DateFractions
//   auto: boolean

//   isNew: boolean

//   isEmpty(): boolean
//   isEqual(other: ITypeDescription): boolean
//   isTable(): boolean
// }

// export interface IFormAttribute {
//   title: string
//   name: string
//   path: string
//   storedData: boolean
//   valueType: ITypeDescription
// }

// export interface IFormHorizontalAlignableProperties {
//   horizontalAlignInGroup: SystemEnumeration.HorizontalAlign
// }

// export interface IFormHorizontalStretchableProperties {
//   horizontalStretch?: boolean
// }

// export interface IPicture {}

// export interface IShortcut {}

// export interface IColor {}

// // {Тип = ЭлементСтиля, }

// export interface IFont {
//   type: SystemEnumeration.FontType
//   strikeout: boolean
//   faceName: string
//   ref: string
//   scale: number
//   italic: boolean
//   underline: boolean
//   bold: boolean
//   size: number
// }

// export interface IEnterpriseTransform {
//   import(element: IFormElement): void

//   export(element: IFormElement): void
// }

// export interface IPropertiesEnterpriseTransform {
//   import(properties: IFormElementProperties): void

//   export(properties: IFormElementProperties): void
// }

// export interface IXMLTransform {
//   nodeName: string

//   import(element: IFormElement): void

//   export(element: IFormElement): void
// }

// export interface IXMLImportRules<T extends IFormElement> {
//   import(data: string): T
// }

// export interface IFormatter {
//   render(element: IFormElement, params: IFormatterParams): string[]
// }

// export interface IHTMLExportRules<T extends IFormElement> {
//   export(element: T): React.ReactNode
// }

// export interface IMultilanguageString {
//   [key: string]: string
// }

// export enum WrapInGroupStrategy {
//   None,
//   Always,
//   Auto,
// }

// export interface I8nText {
//   [key: string]: string
// }
