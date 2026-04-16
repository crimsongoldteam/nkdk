# ISSUES

Issues JSON is provided at start of context. Parse it to get open issues with their bodies and comments.

**Ишуи с меткой `round-trip` обрабатывать нельзя.** Это сырые тикеты, заведённые автоматически short-round-trip-скриптом; они требуют предварительного анализа пользователем, и фикстур/контекста для них, как правило, недостаточно. Если такая ишуя всё-таки попала в список (метка снята, фильтр пропустил), пропусти её и переходи к следующей по приоритету. Если в списке остались только round-trip-ишуи — выведи `<promise>COMPLETE</promise>`.

You've also been passed a file containing the last 10 RALPH commits (SHA, date, full message). Review these to understand what work has been done.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Tracer bullets for new features

Tracer bullets comes from the Pragmatic Programmer. When building systems, you want to write code that gets you feedback as quickly as possible. Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

3. Polish and quick wins
4. Refactors

If all tasks are complete, output <promise>COMPLETE</promise>.

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

# EXECUTION

Complete the task.

# COMMIT

Сформируй git-коммит по правилам скилла `.claude/skills/commit/SKILL.md` (тип + эмодзи-shortcode + описание в инфинитиве на русском), но с префиксом `RALPH:` в самом начале заголовка.

Формат заголовка:

```
RALPH: <тип>: <:эмодзи:> <описание в инфинитиве>
```

- `<тип>` и `<:эмодзи:>` — строго из таблицы скилла (`feat/:sparkles:`, `fix/:bug:`, `refactor/:recycle:`, `test/:white_check_mark:`, `docs/:memo:`, `chore/:wrench:`, `perf/:zap:`, `revert/:rewind:`)
- описание — на русском, глагол в инфинитиве, без точки в конце
- вся строка заголовка ≤ 72 символов (с учётом `RALPH:` и shortcode эмодзи)
- без области (scope), без `(#N)` в заголовке — ссылку на задачу клади в футер (`Closes #N` закрывает, `Refs #N` связывает)

В теле коммита (после пустой строки) укажи:
1. ключевые решения
2. затронутые файлы или области, если это не очевидно из диффа
3. блокеры или заметки для следующей итерации

Тело пиши про «почему», а не пересказывай изменения. Держи коротко.

# THE ISSUE

If the task is complete, close the original GitHub issue.

If the task is not complete, leave a comment on the GitHub issue with what was done.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
