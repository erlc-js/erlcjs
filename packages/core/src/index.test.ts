import { Client, ERLCEvents } from './index.js';

const client = new Client({
    polling: true,
    webhook: {
        enabled: true,
        port: 3000,
    },
    serverKey: process.env.API_KEY!,
});

client.on(ERLCEvents.vehicleAdd, (vehicle) => {
    if (vehicle.name === 'Chevlon Commuter Van 2006') {
        vehicle.owner.message('Restricted vehicle. Change.');
        setTimeout(() => {
            if (
                client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId &&
                client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name
            )
                return;
            vehicle.owner.message('Change the vehicle in 10 seconds or you will be kicked.');
        }, 10000);
    }
});

client.on(ERLCEvents.playerJoin, (player) => {
    console.log(player);
});
