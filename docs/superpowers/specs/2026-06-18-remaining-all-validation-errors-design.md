# Remaining `all` Validation Errors Design

## Summary

Нужно убрать 4 оставшиеся ошибки `all` validation без изменения XML/YAML round-trip, XML-фикстур и YAML-файлов. Ошибки делятся на две независимые группы:

- `ВнешнийИсточникДанных.*` не считается владельцем metadata, поэтому ломаются ссылки на сам объект и его `Функция.*`.
- `ПутьКДанным: 1/0:<uuid>` в `InputField` с `РасширенноеРедактированиеМножественныхЗначений` является служебным платформенным токеном, а не обычным DataPath.

## Goals

- Разрешить `ВнешнийИсточникДанных.<Имя>` как владельца metadata через существующий файл `ВнешнийИсточникДанных/<Имя>/Свойства.yaml`.
- Разрешить прямые ссылки `ВнешнийИсточникДанных.<Имя>.Функция.<ИмяФункции>` только при наличии `Функции/<ИмяФункции>/Свойства.yaml`.
- Принять служебный токен вида `1/0:<uuid>` только в узком контексте `InputField.ПутьКДанным`, когда включено `РасширенноеРедактированиеМножественныхЗначений`.
- Сохранить строгую проверку обычных `DataPath` во всех остальных местах.

## Non-Goals

- Не менять fromXML/toXML/fromYAML/toYAML.
- Не редактировать XML-фикстуры и выгруженные YAML-файлы.
- Не ослаблять общий regex `DataPath`.
- Не превращать неизвестные владельцы или неизвестные члены metadata в warning.

## Design

### ExternalDataSource owner

В `OwnerMetadataCache` добавляется поддержка kind `ВнешнийИсточникДанных` с физическим каталогом `ВнешнийИсточникДанных`. Это позволяет `ProjectMetadataResolver` загружать модель владельца из `Свойства.yaml` так же, как для документов, справочников, отчетов и других прикладных объектов.

### ExternalDataSource function member

В `ProjectMetadataResolver.resolveMember` добавляется отдельный fallback для прямого member-target `Function`. Он срабатывает только если:

- обычный `resolveMemberSegments` вернул `нет сегмента "<Имя>"`;
- target содержит ровно один сегмент `{ kind: "Function", name }`;
- рядом с владельцем существует файл `Функции/<Имя>/Свойства.yaml`.

При успехе resolver возвращает `ok: true`, `filePath` найденного файла и `details: { kind: "Function", name, item: name }`. Этот fallback не должен затрагивать формы, макеты, реквизиты и вложенные member-target.

### Opaque multiple-value DataPath

Служебный токен `1/0:<uuid>` не является путем к реквизиту, поэтому общий DataPath resolver не должен считать его новым корнем. Вместо этого validation формы получает узкую проверку перед обычным разрешением:

- значение соответствует строгому шаблону `^\d+/\d+:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`;
- occurrence относится к `InputField`;
- правило свойства — `ПутьКДанным`;
- у элемента включено `РасширенноеРедактированиеМножественныхЗначений`.

Если условия выполнены, путь считается валидным служебным источником. Если хотя бы одно условие не выполнено, остаются текущие ошибки regex/resolve.

## Tests

- `metadata/validation/dataPath/ownerCache.test.ts`: `OwnerMetadataCache` читает `ВнешнийИсточникДанных/<Имя>/Свойства.yaml`.
- `metadata/validation/projectMetadataResolver.test.ts`: `ВнешнийИсточникДанных.<Имя>.Функция.<Имя>` проходит при наличии `Функции/<Имя>/Свойства.yaml`.
- Отрицательные resolver-тесты: отсутствующая функция остается ошибкой; вложенный target `Функция.X.Реквизит.Y` не попадает под fallback.
- `metadata/validation/validateForm.test.ts`: `InputField.ПутьКДанным: 1/0:<uuid>` проходит только при включенном `РасширенноеРедактированиеМножественныхЗначений`.
- Отрицательный form-тест: тот же токен без признака множественного редактирования остается ошибкой.

## Verification

- `pnpm --dir packages/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts metadata/validation/projectMetadataResolver.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts`
- `all` validation на `/tmp/round-trip-yaml-validation/current/all`
- `pnpm test`

## Expected Result

- Ошибки `ВнешнийИсточникДанных`: `2 -> 0`.
- Ошибки служебного `ПутьКДанным`: `2 -> 0`.
- `all` validation: `4 error -> 0 error`.
- Предупреждения не являются целью этого изменения.
