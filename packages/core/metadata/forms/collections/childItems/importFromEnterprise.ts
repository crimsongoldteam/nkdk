// export const importChildItemsFromEnterprise = (
//   context: ConfigurationContext,
//   data: ChildItemsPartialEnterprise | undefined
// ): ChildItems | undefined => {
//   if (!data) return undefined

//   const result: ChildItems = []
//   for (const [elementType, itemData] of Object.entries(data)) {
//     const elementType = importFormElementTypeFromEnterprise(context, itemData.Тип)
//     const fn = getOperationFunction("ImportPartialFromEnterprise", elementType)
//     if (!fn) throw new Error(`Import function not found for element type: ${elementType}`)
//     const item = fn(context, itemData)
//     if (item !== undefined) {
//       result.push(item as ChildItem)
//     }
//   }

//   return result.length > 0 ? result : undefined
// }
