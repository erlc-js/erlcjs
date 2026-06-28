import { Client, ERLCEvents } from "./index.js";

const client = new Client({
    polling: true,
    serverKey: process.env.API_KEY!,
})

client.on(ERLCEvents.vehicleAdd, (vehicle) => {
    if (vehicle.name === 'Chevlon Commuter Van 2006' && vehicle.owner.permission === 'Normal') {
        vehicle.owner.message('Restricted vehicle. Change.')
        setTimeout(() => {
            if (client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId && client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name) return;
            vehicle.owner.message('Change the vehicle in 10 seconds or you will be kicked.')       
        }, 10000)
    }
})