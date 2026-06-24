# UserVisible Empty Deny YAML

## Проблема

`round-trip-yaml` теряет блоки `Visible` в командном интерфейсе формы, если внутри есть только:

```xml
<Visible>
  <xr:Common>false</xr:Common>
</Visible>
```

XML-слой сохраняет это как `UserVisible` с `common: false` и пустым списком `values`. YAML-экспорт сейчас отбрасывает любой `UserVisible` без ролей, поэтому явное состояние "запретить всем" пропадает из YAML формы и не может восстановиться при `sync`.

## Решение

Представлять явный пустой запрет в YAML так:

```yaml
Использование:
  Разрешить: Ложь
```

Это минимальная YAML-форма для `UserVisible` с `common: false` и без ролевых записей.

Пустое разрешение (`common: true`, без ролей) по-прежнему не выгружается, потому что оно не несёт явного ограничения и соответствует текущему компактному YAML-поведению.

## Границы

Изменение относится к общему типу `commonObjects/userVisible`, а не к `forms/commonObjects/commandInterface`.

Так все потребители `UserVisible` останутся согласованными:

- элементы командного интерфейса формы;
- элементы формы с `Использование`;
- реквизиты формы с `Просмотр` и `Редактирование`.

## YAML-договор

`UserVisibleJSONSchema` должна разрешать отсутствие `Роли`, если присутствует `Разрешить: Ложь`.

Валидные примеры:

```yaml
Использование:
  Разрешить: Ложь
```

```yaml
Использование:
  Роли:
    Role.Администратор: Ложь
```

```yaml
Использование:
  Разрешить: Ложь
  Роли:
    Role.Администратор: Истина
```

Невалидный пример:

```yaml
Использование:
  Роли: {}
```

## Заметки по реализации

- `exportUserVisibleToYAML` должен возвращать `{ [yamlKey]: { Разрешить: "Ложь" } }` для `common: false` и `values.length === 0`.
- `exportUserVisibleToYAML` должен продолжить возвращать `undefined` для `common: true` и `values.length === 0`.
- `importUserVisibleFromYAML` должен считать отсутствующее `Роли` пустым списком ролей.
- Существующий YAML с ролевыми записями должен сохранить прежний вид.

## Тесты

Добавить или обновить точечные тесты в `commonObjects/userVisible`:

- экспорт пустого запрета в YAML;
- сохранение текущего пропуска пустого разрешения;
- импорт пустого запрета из YAML;
- JSON schema принимает пустой запрет;
- JSON schema всё ещё отклоняет пустой объект ролей.

Добавить регрессионный тест для `forms/commonObjects/commandInterface` или `roundTripYAMLFast`, покрывающий команду с `visible: { common: false, values: [] }`.

## Проверка

Сначала запустить точечные тесты:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/userVisible metadata/forms/commonObjects/commandInterface metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Then verify the diagnostic case:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Перед закрытием issue запустить:

```bash
pnpm test
```
