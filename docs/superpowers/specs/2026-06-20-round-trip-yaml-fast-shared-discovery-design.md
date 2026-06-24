# Shared Round-Trip XML Discovery

## Проблема

`round-trip-yaml` и `round-trip-yaml-fast` расходятся по покрытию XML.

Полный `round-trip-yaml` использует штатный рабочий контур:

```text
nkdk import <xml-dir> <yaml-dir>
nkdk sync <yaml-dir> <xml-dir> --reference <xml-dir>
```

Поэтому он видит все XML-файлы, которые участвуют в импорте и синхронизации YAML-проекта.

`round-trip-yaml-fast` сейчас имеет собственный ручной обход `listRoundTripEntries`. Он проверяет верхнеуровневые XML, дочерние file-item XML и формы из папок `Forms/*/Ext/Form.xml`, но пропускает `filePath`-свойства. Из-за этого fast не проверяет, например:

```text
CommonForms/ДинамическийСписок/Ext/Form.xml
```

Этот файл является `MetadataCommonForm.form` с `filePath: "Ext/Form.xml"`, а не дочерней формой в папке `Forms`.

## Решение

Вынести общий механизм discovery XML-единиц round-trip в `core` и использовать его в быстрых диагностических проверках вместо ручного списка.

Общий обход должен описывать XML-единицы, которые штатный YAML-контур умеет импортировать и восстанавливать:

- корневой `Configuration.xml`;
- верхнеуровневые metadata XML;
- дочерние file-item XML;
- формы `Forms/*/Ext/Form.xml`;
- XML-файлы свойств с `filePath`, если у типа свойства есть XML/YAML-обработка и файл участвует в рабочем контуре.

`round-trip-yaml-fast` должен строить проверяемые единицы через этот общий обход. Если штатный `nkdk import/sync` обрабатывает XML-файл, fast не должен молча пропускать его.

## Границы

Изменение относится к диагностическому покрытию, а не к исправлению самого DCS diff.

Текущий diff в `CommonForms/ДинамическийСписок/Ext/Form.xml` остаётся отдельной проблемой YAML-представления DCS-значений и `xsi:type`. Цель этой задачи — чтобы fast тоже находил этот diff.

Внешние файлы без YAML-договора не должны становиться round-trip единицами fast:

- `.bsl`;
- бинарные файлы;
- картинки;
- справка;
- reference-only файлы, которые полный `round-trip-yaml` копирует без YAML-представления.

## Архитектура

Нужен небольшой общий слой discovery с явной моделью результата, например:

```ts
type RoundTripXmlEntry =
  | MetadataEntry
  | FormEntry
  | FilePathPropertyEntry
```

Каждая entry должна содержать:

- относительный XML-путь;
- абсолютный XML-путь;
- правило metadataItem или свойства;
- имя объекта;
- owner stack для metadata target;
- reference-путь, если он нужен для восстановления source/reference данных.

`roundTripYAMLFast` должен использовать эти entries для запуска XML -> модель -> YAML-текст -> модель -> XML-текст.

`nkdk import/sync` не обязательно переписывать полностью за один шаг, но общий discovery должен опираться на те же правила metadata и покрывать те же классы ресурсов. В дальнейшем штатный import/sync можно будет перевести на этот discovery напрямую.

## Проверка

Добавить регрессию в `roundTripYAMLFast.test.ts`:

- фикстура общей формы с `Ext/Form.xml`;
- внутри формы значение, которое меняется при потере source/reference, например DCS `xs:string` `"123"`, которое без reference восстанавливается как `xs:decimal`;
- ожидание: fast возвращает diff для `CommonForms/<Имя>/Ext/Form.xml`.

После исправления текущий внешний прогон должен измениться:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Ожидаемо: fast больше не чистый и показывает diff `CommonForms/ДинамическийСписок/Ext/Form.xml`.

Полный `round-trip-yaml` должен продолжить показывать тот же diff, пока не будет отдельно исправлена DCS-проблема.

Перед закрытием issue:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
pnpm test
```
