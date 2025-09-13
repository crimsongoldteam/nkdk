// import { GroupElement } from "@/elements"
// import { IFormatter } from "../interfaces"
// import { CommonGroupType } from "@/metadata/interface"
// import { FormatterFactory } from "../formatterFactory"
// import { SimpleIndentationStrategy } from "../indentation/simpleIndentationStrategy"

// export class GroupFormatter extends BaseFormatter<GroupElement> {
//   public format(element: GroupElement): string[] {
//     if (element.type === CommonGroupType.VerticalGroup) {
//       const result = FormatterFactory.format(element, indentationStrategy: SimpleIndentationStrategy)
//       return result
//     }

//     if (element.isOneLineGroup()) {
//       return FormatterFactory.getOneLineGroupFormatter().format(element, indentationStrategy: SimpleIndentationStrategy)
//     }

//     return FormatterFactory.getHorizontalGroupFormatter().format(element, indentationStrategy: SimpleIndentationStrategy)
//   }
// }
