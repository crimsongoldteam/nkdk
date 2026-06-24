# Дизайн: сохранить `xsi:nil` для DCS SettingsParameterValue

## Контекст

В полном round-trip `XML -> YAML -> XML` для формы
`Catalogs/Операции0/Forms/ПодборДляНоменклатуры/Ext/Form.xml` найдено расхождение:

```diff
- <dcscor:value xsi:nil="true"/>
+ <dcscor:value xsi:type="v8:LocalStringType">
+   <v8:item>
+     <v8:lang>Использовать</v8:lang>
+     <v8:content>Ложь</v8:content>
+   </v8:item>
+ </dcscor:value>
```

Исходный XML содержит `dcscor:use=false`, `dcscor:parameter=Текст` и
пустое значение `dcscor:value xsi:nil="true"`. YAML намеренно остаётся
компактным:

```yaml
Текст:
  Использовать: Ложь
```

Пользовательское решение: не добавлять явный YAML-маркер пустого значения;
при обратной записи XML нужно полагаться на reference XML.

## Причина

`packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
сейчас вычисляет `rawValue` как `y?.["Значение"] ?? yamlToParse`.
Для YAML-объекта `{ Использовать: Ложь }` это приводит к тому, что весь
объект передаётся в `DcsMetadataValue` как значение `DesignTimeValue`.
Дальше он экспортируется как `v8:LocalStringType` с языком `Использовать`
и содержимым `Ложь`.

## Решение

Изменить чтение `SettingsParameterValue` из YAML так, чтобы развёрнутый
объект считался значением только при явном наличии ключа `Значение`.

Ожидаемая модель для YAML:

```ts
{
  parameter: "Текст",
  use: false
}
```

Без поля `value` `toXML.ts` уже использует `referenceData.__referenceNilValue`
и восстанавливает `dcscor:value xsi:nil="true"`. Это сохраняет текущий
формат YAML и не переносит reference-семантику в пользовательский YAML.

## Границы

- Не менять XML-фикстуры.
- Не вводить явный YAML-маркер `null` или `<nil>`.
- Не менять общий формат `DcsMetadataValue`.
- Не писать новые `fromXML/toXML/fromYAML/toYAML` правила вне существующего
  модуля `parameterValue`.

## Проверка

- Добавить точечный тест `fromYAML` для `{ Использовать: Ложь }`, который
  подтверждает отсутствие `value`.
- Добавить или расширить `toXML`/round-trip тест на восстановление
  `xsi:nil` из reference XML при текущей модели без `value`.
- Запустить точечные тесты модуля `parameterValue`.
- После исправления проверить выбранный diff через `round-trip-yaml` single
  или triage для первого расхождения.
