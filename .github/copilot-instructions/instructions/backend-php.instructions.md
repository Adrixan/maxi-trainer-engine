---
applyTo: 
  - "**/*.php"
---
<php_standards>

## PHP (Laravel / Symfony)

- **PHP 8.3+** with `declare(strict_types=1);` at top of EVERY file
- **Laravel 11.x** or **Symfony 7.x**
- **Readonly properties** and constructor promotion
- **Typed class constants** (PHP 8.3): `const string STATUS_ACTIVE = 'active';`
- **`#[\Override]` attribute** on all overridden methods
- **`json_validate()`** for JSON input checking before decode
- **Enums** for fixed value sets (backed enums for serialization)
- **Testing:** PHPUnit 11 or Pest 3
- **Static Analysis:** PHPStan (level 9) or Psalm
- **SAST:** Semgrep or Psalm taint analysis in CI

See [examples/backend/php/](../examples/backend/php/) for UserService and UserServiceTest patterns.
</php_standards>
