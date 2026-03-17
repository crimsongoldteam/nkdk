export type ScrollBarUse = "AutoUse" | "DontUse" | "UseAlways"

export type ScrollBarUseEnterprise = {
  Type: "SystemEnumeration"
  Value: `ScrollBarUse.${ScrollBarUse}`
}
