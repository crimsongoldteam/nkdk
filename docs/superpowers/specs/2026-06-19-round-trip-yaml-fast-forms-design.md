# Round-Trip YAML Fast Forms Design

## Цель

`round-trip-yaml-fast` должен проверять формы и другие внешние XML-файлы, которые обрабатываются штатным `nkdk import`, не ограничиваясь XML-файлами верхнего уровня.

## Границы

- Fast-цикл остаётся диагностикой без записи итоговых YAML/XML-деревьев.
- Источник проверяемых файлов должен соответствовать штатным механизмам `nkdk import`.
- Нельзя добавлять независимый рекурсивный обход `Forms/**`, который разойдётся с импортом.
- Внешние бинарные и сырьевые файлы не сравниваются как XML; fast проверяет XML/YAML-преобразование разобранных metadata-объектов.

## Подход

Расширить `roundTripYAMLFast` внутренним источником задач для внешних metadata-файлов. Для форм источник должен переиспользовать те же функции чтения, что и `ChildFormNames`/`convertFormFromXML`: metadata-файл формы `Forms/<Имя>.xml` и тело формы `Forms/<Имя>/Ext/Form.xml` читаются через `readFormFromXML`.

Для каждой формы fast выполняет in-memory цикл:

```text
readFormFromXML -> exportClientApplicationFormToYAML -> YAML text -> importClientApplicationFormFromYAML -> exportFormMetadataToXML/exportClientApplicationFormToXML -> compare
```

## Ошибки И Результаты

Каждый diff должен указывать исходный XML-файл:

- `Forms/<Имя>.xml`, если изменился metadata XML формы;
- `Forms/<Имя>/Ext/Form.xml`, если изменилось тело формы.

Ошибки чтения или преобразования формы должны попадать в `errors` с тем же форматом, что и существующие ошибки верхнеуровневых XML.

## Тестирование

Нужен регрессионный тест, который создаёт минимальный объект с формой, содержащей `dcsset:FilterItemComparison` с явным `<dcsset:comparisonType>Equal</dcsset:comparisonType>`, и проверяет, что `roundTripYAMLFast` возвращает diff по `Forms/<Форма>/Ext/Form.xml` до исправления `FilterItemComparison`.

Дополнительно нужен тест, что форма без расхождений увеличивает `checked` и не даёт diff.
