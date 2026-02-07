// import { ConfigurationContext } from "~/metadata/context/types"
// import { FormElementType } from "../../../metadataFactory/types"
// import { BaseElementPropsEnterprise, NamedElement } from "./types"

// export const importBaseElementFromEnterprise = <
//   T extends BaseElementPropsEnterprise | undefined,
//   N extends string | undefined,
// >(
//   _context: ConfigurationContext,
// _rule: PropertyRule<any>,
//   data: T,
//   name: N
// ): NamedElement => {
//   if (data === undefined) return undefined as NamedElement

//   if (!name) return undefined as NamedElement

//   const result: NamedElement = {
//     elementType: FormElementType.BaseElement,
//     name,
//   }

//   return result
// }
