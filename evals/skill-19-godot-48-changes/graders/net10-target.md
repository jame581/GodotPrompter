---
type: llm
focus: last_message
weight: 2
---
Pass only if the answer sets the project's TargetFramework to `net10.0` and says the .NET SDK installed on the runner must be version 10 (or newer). Fail if the csproj targets `net8.0`, `net9.0` or any other framework, or if the answer tells the user to install .NET 8 or 9 for the build, even if it mentions .NET 10 elsewhere as optional.
