# Server Boundary

این پوشه Backend Core پروژه است.

- `database/`: persistence adapters
- `domain/`: business rules and domain types
- `security/`: auth, ownership, rate limiting

قانون: فایل‌های `src/components` و UI routes نباید مستقیم از این پوشه import کنند. فقط `src/app/api` و server-side infrastructure مجاز به استفاده از آن هستند.
