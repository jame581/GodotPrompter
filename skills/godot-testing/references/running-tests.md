# Running Tests

Reference for `skills/godot-testing/SKILL.md` — GUT CLI, gdUnit4 CLI, GitHub Actions CI workflow.

> ← Back to [SKILL.md](../SKILL.md)

---
## Running Tests

### GUT CLI

```bash
# Run all tests
godot --headless -s addons/gut/gut_cmdln.gd

# Run a specific directory
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests/unit

# Run a specific file
godot --headless -s addons/gut/gut_cmdln.gd -gtest=res://tests/unit/test_health_component.gd

# Verbose output with log file
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests -glog=3 -goutput_dir=res://test_results
```

### gdUnit4 CLI

```bash
# Run all tests
godot --headless -s addons/gdUnit4/bin/GdUnit4CSharpApiLoader.cs -- --testsuites res://tests

# GDScript only
godot --headless -s addons/gdUnit4/GdUnitRunner.gd -- --testsuites res://tests/unit

# Run a specific test file
godot --headless -s addons/gdUnit4/GdUnitRunner.gd -- --testsuites res://tests/unit/test_health_component.gd

# With report output
godot --headless -s addons/gdUnit4/GdUnitRunner.gd -- --testsuites res://tests --report-dir ./reports
```

### GitHub Actions CI

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-gut:
    name: GUT Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Godot
        uses: chickensoft-games/setup-godot@v2
        with:
          version: 4.3.0
          use-dotnet: false

      - name: Import project
        run: godot --headless --import 2>&1 | tail -5

      - name: Run GUT tests
        run: >
          godot --headless
          -s addons/gut/gut_cmdln.gd
          -gdir=res://tests
          -gexit
          -glog=2

  test-gdunit4:
    name: gdUnit4 Tests (GDScript + C#)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Godot with .NET
        uses: chickensoft-games/setup-godot@v2
        with:
          version: 4.3.0
          use-dotnet: true

      - name: Restore NuGet packages
        run: dotnet restore

      - name: Import project
        run: godot --headless --import 2>&1 | tail -5

      - name: Run gdUnit4 tests
        run: >
          godot --headless
          -s addons/gdUnit4/GdUnitRunner.gd
          --
          --testsuites res://tests
          --report-dir ./reports

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: reports/
```

---

