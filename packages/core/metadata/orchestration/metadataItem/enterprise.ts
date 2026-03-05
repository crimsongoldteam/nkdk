import { PropertyRuleType, PropertyYoEnterprise } from "~/metadata/orchestration/property/registry"

export type EnterpriseType<
  T extends { properties: Record<string, PropertyRuleType>; enterpriseField: string; enterpriseFieldType: string },
> = T["properties"] extends infer Properties
  ? {
      [K in keyof Properties as Properties[K] extends { toEnterprise?: false }
        ? never
        : Capitalize<K extends string ? K : never>]?: Properties[K] extends {
        type: infer PropertyType
      }
        ? PropertyType extends PropertyRuleType
          ? PropertyYoEnterprise<PropertyType>
          : unknown
        : never
    } & {
      ElementType: T["enterpriseField"]
      Name: string
    } & (T["enterpriseFieldType"] extends "None"
        ? {}
        : { Type: { Type: "SystemEnumeration"; Value: T["enterpriseFieldType"] } })
  : never

// as Extra
// ct<Properties[K], { toEnterprise?: false }>
// extends never ? never : never
// keyof Extract<
//   T["properties"][K in keyof T["properties"] as T["properties"][K] extends { toEnterprise?: false } ? K : never]

//   extends infer Key],
//   { toEnterprise?: false }
// >

// export type EnterpriseType<T extends ElementRule<InputField>> = {
//   [K in keyof T["properties"] as Extract<T["properties"][K], { toEnterprise: false }> extends never
//     ? K
//     : never]: T["properties"][K] extends { type: infer PropertyType }
//     ? PropertyType extends TypeRulesNamesNew
//       ? TypeByKey<PropertyType>
//       : never
//     : never
// }

// const val: InputFieldEnterprise = {
//   EnterpriseField: "FormField",
//   AllowInputEmptyMultipleValues: true,

//   QuickChoice: false,
// }

// type test = InputFieldEnterprise extends InputFieldEnterprise ? true : false

// & { EnterpriseField: T["enterpriseField"] }

// type l = TypeByKey<"string">
// type testKeys = TypesMap extends [infer First, any] ? First : never
// type testTypes<Key extends testKeys> = Extract<TypesMap, [Key, any]>[1]

// type d = testTypes<"boolean">

// // const dv: d = "1"

// type TestRule<T extends typeof TableRules> = {
//   [K in keyof T["properties"]]: T["properties"][K] extends infer Prop
//     ? Prop extends { type: infer Type }
//       ? Type extends testKeys
//         ? testTypes<Type>
//         : never
//       : never
//     : never
// }

// type t = TestRule<typeof TableRules>

// // const l: t

// type TestRuleXML<T extends typeof TableRules> = {
//   [K in keyof T["properties"] as T["properties"][K] extends { xml?: infer XMLKey }
//     ? XMLKey extends string
//       ? XMLKey
//       : never
//     : K extends string
//       ? Capitalize<K>
//       : never]: T["properties"][K] extends infer Prop
//     ? Prop extends { type: infer Type }
//       ? Type extends testKeys
//         ? testTypes<Type> | undefined
//         : never
//       : never
//     : never
// }

// type tx = TestRuleXML<typeof TableRules>

// const test: tx = {
//   AutoMaxWidth: true,
// } // const test: tx = { _DisplayImportance: true }

// test.ViewStatusAddition = "test"
