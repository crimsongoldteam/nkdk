export interface ProjectStateReadTokenTypeMap {}

export type ProjectStateReadToken = ProjectStateReadTokenTypeMap extends { token: infer Token } ? Token : never
