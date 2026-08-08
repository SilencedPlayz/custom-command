# CustomCommand by Silenced

A lightweight wrapper around the Minecraft Bedrock Script API Custom Command Registry that simplifies command registration.

## Features

- Commands and enums can be registered in any order.
- Automatically batches registrations into a single startup callback.
- Uses string permission levels instead of `CommandPermissionLevel` enums
  (e.g. `"Any"`, `"GameDirectors"`, `"Admin"`, `"Host"`, `"Owner"`).
- Converts `params` into `mandatoryParameters` and `optionalParameters` automatically.
- Automatically prefixes commands, enums, and parameter names with the provided namespace.

## Example

```js
import { CustomCommand } from "./CustomCommand.js";

const cc = new CustomCommand("demo");

cc.addEnum("gamemode", ["survival", "creative"]);

cc.addCommand({
  name: "hello",
  description: "Example command",
  permissionLevel: "Any",
  params: {
    gamemode: { type: "Enum" },
    target: { type: "Player", optional: true }
  }
}, (origin, mode, target) => {
  console.warn(`Mode: ${mode}`);
});
```

The example above registers:

- Enum: `demo:gamemode`
- Command: `demo:hello`

Even though `addEnum()` and `addCommand()` are called separately, `CustomCommand` batches them and installs everything automatically during startup.
