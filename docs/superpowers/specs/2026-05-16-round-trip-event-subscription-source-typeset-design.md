# Round-trip EventSubscription Source TypeSet

## Контекст

В `EventSubscription.Properties.Source` встречаются оба XML-представления типа:
`v8:Type` и `v8:TypeSet`. Импорт `TypeDescription` сейчас объединяет их в один
массив `type`, а экспорт заново выбирает форму по `TypeDescriptionRules.modifier`.
Из-за этого round-trip может менять исходную XML-форму без изменения смысла.

Пример расхождения:

```xml
<v8:TypeSet>cfg:ChartOfAccountsObject</v8:TypeSet>
```

после round-trip становится:

```xml
<v8:Type>cfg:ChartOfAccountsObject</v8:Type>
```

## Проверка корпуса

По `EventSubscriptions` в `acc`, `trade`, `small` и `doc` проверены формы записи
типов в `Source`.

Типы с точкой, например `cfg:DocumentObject.Накладная`, не смешивают формы:
они встречаются только как `v8:Type`.

Голые типы без точки смешивают формы. Примеры:

- `cfg:ChartOfAccountsObject`: `v8:Type` и `v8:TypeSet`
- `cfg:InformationRegisterRecordSet`: `v8:Type` и `v8:TypeSet`
- `cfg:ConstantValueManager`: `v8:Type` и `v8:TypeSet`
- `cfg:AccountingRegisterRecordSet`: `v8:Type` и `v8:TypeSet`

Значит, простая смена `modifier` в `TypeDescriptionRules` для таких типов может
исправить одни файлы и сломать другие.

## Решение

Для `EventSubscription.Source` сохранять XML-форму типа из `referenceMetadata`,
если семантический тип совпадает:

- тип, пришедший из `v8:Type`, экспортировать обратно как `v8:Type`;
- тип, пришедший из `v8:TypeSet`, экспортировать обратно как `v8:TypeSet`;
- порядок типов брать из модели, а XML-форму искать по совпадающему тексту типа
  без префикса namespace;
- для типов без совпадения в reference использовать текущие правила
  `TypeDescriptionRules`.

Это сохраняет round-trip для существующего XML и не усложняет YAML.

## YAML и модель

Формат YAML не меняется. `Источник` остается обычным `TypeDescription`, например:

```yaml
Источник:
  - ChartOfAccountsObject
  - DocumentObject.Накладная
```

Модель также не обязана хранить XML-форму как пользовательское поле. Если при
реализации потребуется техническая метка, она должна быть служебной и не попадать
в YAML.

## Границы

В рамках этой спеки:

- исправляется только сохранение `v8:Type`/`v8:TypeSet` для
  `EventSubscription.Properties.Source`;
- не меняется общий YAML-формат `TypeDescription`;
- не выполняется массовая переклассификация `TypeDescriptionRules.modifier`;
- не изменяются XML-фикстуры.

Отдельно можно проверить точечные правила `TypeDescriptionRules` для типов,
которые в полном корпусе встречаются только в одной форме. Это не должно быть
обязательным условием для исправления текущего round-trip.

## Проверка

Для реализации нужны тесты на два случая:

- round-trip сохраняет `v8:TypeSet` для голого типа из reference;
- новая модель без reference экспортируется по текущим правилам
  `TypeDescriptionRules`.

Дополнительно полезна выборочная проверка `EventSubscriptions` на `acc` и `trade`,
чтобы убедиться, что исправленные файлы не создают обратные расхождения.
