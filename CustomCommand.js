/**
 * CustomCommand by Silenced
 *
 * A lightweight wrapper around the Minecraft Bedrock Script API
 * Custom Command Registry that simplifies command registration.
 *
 * Features:
 * - Commands and enums can be registered in any order.
 * - Automatically batches registrations into a single startup callback.
 * - Uses string permission levels instead of CommandPermissionLevel enums
 *   (e.g. "Any", "GameDirectors", "Admin", "Host", "Owner").
 * - Converts `params` into `mandatoryParameters` and
 *   `optionalParameters` automatically.
 * - Automatically prefixes commands, enums, and parameter names with
 *   the provided namespace.
 *
 * Example:
 * ```js
 * const cc = new CustomCommand("demo");
 *
 * cc.addEnum("gamemode", ["survival", "creative"]);
 *
 * cc.addCommand({
 *   name: "hello",
 *   description: "Example command",
 *   permissionLevel: "Any",
 *   params: {
 *     gamemode: { type: "Enum" },
 *     target: { type: "Player", optional: true }
 *   }
 * }, (origin, mode, target) => {
 *   // ...
 * });
 * ```
 */

import { CommandPermissionLevel as CPL, system } from "@minecraft/server";

export class CustomCommand {
  queue = { commands: [], enums: [] };
  scheduled = false;

  constructor(namespace = "test") {
    this.namespace = namespace;
  }

  addCommand(data, func) {
    const cmdData = {
      ...data,
      name: `${this.namespace}:${data.name}`
    };
    this.#convertParams(cmdData);
    this.queue.commands.push({ data: cmdData, func });

    this.#schedInstall();
  }

  addEnum(name, options) {
    this.queue.enums.push({ name: `${this.namespace}:${name}`, options });
    this.#schedInstall();
  }

  #schedInstall() {
    if (this.scheduled) return;
    this.scheduled = true;

    Promise.resolve().then(() => {
      const queue = this.queue;
      this.queue = { commands: [], enums: [] };

      try {
        this.#startInstall(queue);
      } catch (err) {
        console.error(err);
      } finally {
        this.scheduled = false;
      }
    });
  }

  #startInstall(listData) {
    system.beforeEvents.startup.subscribe(({ customCommandRegistry: ccr }) => {
      // enums first
      for (const enm of listData.enums) ccr.registerEnum(enm.name, enm.options);

      // commands second
      for (const cmd of listData.commands)
        ccr.registerCommand(cmd.data, cmd.func);
    });
  }

  #convertParams(data) {
    const perm = data.permissionLevel ?? "Any";
    data.permissionLevel = CPL[perm];

    if (!data.params) return;

    data.optionalParameters = [];
    data.mandatoryParameters = [];

    for (const [name, info] of Object.entries(data.params)) {
      const provider = !info.optional
        ? data.mandatoryParameters
        : data.optionalParameters;
      provider.push({ name: `${this.namespace}:${name}`, type: info.type });
    }

    if (data.optionalParameters.length === 0) delete data.optionalParameters;
    if (data.mandatoryParameters.length === 0) delete data.mandatoryParameters;
    delete data.params;
  }
}
