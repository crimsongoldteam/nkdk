export interface TypeDescriptionView {
  readonly type?: readonly string[]
  readonly typeId?: readonly string[]
  readonly stringQualifiers?: {
    readonly length: number
    readonly allowedLength: "Variable" | "Fixed"
  }
  readonly numberQualifiers?: {
    readonly digits: number
    readonly fractionDigits: number
    readonly allowedSign: "Any" | "Nonnegative"
  }
  readonly dateQualifiers?: {
    readonly dateFractions?: "Date" | "Time" | "DateTime"
  }
}
