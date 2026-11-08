import { Player } from "@erlcjs/core";

/**
 * Welcomes the player on join.
 * @param message - Optional custom message to send to player.
 * @example
 * ```typescript
 * client.on(ERLCEvents.playerJoin, welcomePlayer())
 * ```
 * @returns Callback function to pass into client event.
 * @public
 */
export function welcomePlayer(message?: string): (player: Player) => void {
    return (player: Player) => {
        void player
            .message(message ?? `Welcome to ${player.server.info?.name}!`)
            .catch((err) => player.client._emitError(err));
    }
}

/**
 * Bans player that rejoin within a set number of seconds after a kick.
 * @param timespan - The number of seconds which they can rejoin after, default 1800 (30 minutes).
 * @example
 * ```typescript
 * client.on(ERLCEvents.playerJoin, banKickRejoin())
 * ```
 * @returns Callback function to pass into client event.
 * @public
 */
export function banKickRejoin(timespan: number = 1800): (player: Player) => void {
    return (player: Player) => {
        const timestamp = Date.now() / 1000 - timespan
        const targets = [player.username, String(player.id)];
        const kicks = player.server.commandLogs.cache.filter((log) => {
            if (log.timestamp <= timestamp) return false;
            const command = log.command.trim();
            return targets.some((target) => command === `:kick ${target}` || command.startsWith(`:kick ${target} `));
        });
        if (kicks.size >= 1) {
            void player
                .ban(`Rejoin within ${timespan} seconds of a kick.`)
                .catch((err) => player.client._emitError(err));
        }
    }
}