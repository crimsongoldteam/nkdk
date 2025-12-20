import * as changeCase from "change-case"

export const checkPascalEqually = (str: string, pascalStr: string): boolean => {
  const modifiedStr = changeCase.pascalCase(str)
  return modifiedStr === pascalStr
}
