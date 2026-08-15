export const ordinaryFillValueItemTypes = [
  "MetadataAttribute",
  "MetadataCommonAttribute",
  "MetadataTaskAddressingAttribute",
  "MetadataRegisterAttribute",
  "MetadataRegisterDimension",
  "MetadataRegisterResource",
  "AccountingFlag",
  "ExtDimensionAccountingFlag",
  "MetadataExternalDataSourceField",
  "MetadataExternalDataSourceCubeDimension",
  "MetadataExternalDataSourceCubeResource",
] as const

export type OrdinaryFillValueItemType = (typeof ordinaryFillValueItemTypes)[number]

export function isOrdinaryFillValueItemType(value: string): value is OrdinaryFillValueItemType {
  return ordinaryFillValueItemTypes.some((candidate) => candidate === value)
}
