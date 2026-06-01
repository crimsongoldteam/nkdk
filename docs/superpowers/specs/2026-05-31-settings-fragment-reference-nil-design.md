# Дизайн: восстанавливать `xsi:nil` в SettingsFragment из reference

## Контекст

В полном YAML round-trip остались расхождения в формах:

- `CommonForms/PlannerField/Ext/Form.xml`;
- `CommonForms/УсловноеОформление/Ext/Form.xml`.

В исходном XML внутри `Settings xsi:type="pl:Planner"` есть:

```xml
<pl:value xsi:nil="true"/>
```

В YAML сейчас попадает пустой XML-фрагмент:

```xml
<pl:value/>
```

При обратном sync код честно экспортирует пустой тег из YAML, поэтому теряется `xsi:nil`.

## Решение

Пока не разбирать `PlannerField` и не расширять модель `Planner`.

Временно восстанавливать такие значения только через reference:

1. При чтении reference для `filePath` XML сохранять `xsi:nil`.
2. При экспорте typed `SettingsFragment` получать reference-значение.
3. Если в текущем YAML/модели узел пустой или отсутствует, а в reference на том же месте был `{ "_xsi:nil": true }`, экспортировать `xsi:nil`.
4. Если reference нет, не придумывать `xsi:nil`.

## Границы

Входит:

- `SettingsFragment` для `Chart`, `GanttChart`, `FlowchartContext`, `SpreadsheetDocument`, `Planner`;
- `filePath` reference для форм, включая `MetadataCommonForm.form`;
- восстановление только пустого/отсутствующего узла по точному пути reference.

Не входит:

- полноценный разбор `PlannerField`;
- изменение YAML-формата;
- глобальное включение сохранения `xsi:nil` для всего XML-парсера;
- изменение существующих XML-фикстур.

## Фикстуры

Обязательно добавить фикстуры в проект, а не держать XML/YAML строками внутри теста.

Нужна sync-фикстура общей формы:

- XML: `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/xml/<fixture>/Ext/Form.xml`
  с `Settings xsi:type="pl:Planner"` и `<pl:value xsi:nil="true"/>`;
- YAML: `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/yaml/<fixture>/Свойства.yaml`
  с тем же `Планировщик`, но с `<pl:value/>`;
- ожидаемый XML в sync-проверке должен восстановить `<pl:value xsi:nil="true"/>`.

Если используется общая sync-обвязка, добавить имя фикстуры в список проверяемых файлов, чтобы тест выполнялся как обычная проектная фикстура.

## Проверка

Точечно:

```sh
pnpm --dir packages/core test:isolated metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Реальный сценарий:

```sh
pnpm --dir packages/cli dev sync /home/nikita/git/temp-yaml /tmp/nkdk-settings-fragment-reference-nil --reference /home/nikita/git/round-trip/all
```

Ожидание: в `CommonForms/PlannerField/Ext/Form.xml` и `CommonForms/УсловноеОформление/Ext/Form.xml` остаётся `<pl:value xsi:nil="true"/>`.
