import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent, useMemo } from "react";

export default function FleetPage() {
  const utils = trpc.useUtils();
  const { data: vehicles } = trpc.fleet.getVehicles.useQuery();
  const addVehicle = trpc.fleet.addVehicle.useMutation({ onSuccess: () => utils.fleet.getVehicles.invalidate() });
  const logTrip = trpc.fleet.logTrip.useMutation({ onSuccess: () => utils.fleet.getVehicles.invalidate() });

  const [vehicleForm, setVehicleForm] = useState({ name: "", type: "Truck", plateNumber: "" });
  const [tripForm, setTripForm] = useState({ vehicleId: "", route: "", purpose: "Delivery", fuelUsed: "" });

  const fleetStats = useMemo(() => {
    const stats = {
      totalVehicles: vehicles?.length ?? 0,
      totalTrips: vehicles?.reduce((acc, v) => acc + v.Trip.length, 0) ?? 0,
      totalFuelUsed: vehicles?.reduce((acc, v) => acc + v.Trip.reduce((sum, t) => sum + (t.fuelUsed ?? 0), 0), 0) ?? 0,
      truckCount: vehicles?.filter(v => v.type === "Truck").length ?? 0,
    };
    return stats;
  }, [vehicles]);

  function addVehicleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vehicleForm.name || !vehicleForm.plateNumber) return;
    addVehicle.mutate({ ...vehicleForm });
    setVehicleForm({ name: "", type: "Truck", plateNumber: "" });
  }

  function logTripSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tripForm.vehicleId || !tripForm.route) return;
    const fuel = tripForm.fuelUsed ? parseFloat(tripForm.fuelUsed) : undefined;
    logTrip.mutate({ vehicleId: tripForm.vehicleId, route: tripForm.route, purpose: tripForm.purpose, fuelUsed: fuel });
    setTripForm({ vehicleId: "", route: "", purpose: "Delivery", fuelUsed: "" });
  }

  return (
    <SidebarLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={addVehicleSubmit} className="border rounded-lg p-3 grid gap-2 bg-background">
          <div className="font-medium">Add Vehicle</div>
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Name" 
            value={vehicleForm.name} 
            onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Type" 
            value={vehicleForm.type} 
            onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Plate Number" 
            value={vehicleForm.plateNumber} 
            onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} 
          />
          <button className="bg-primary text-primary-foreground rounded px-3 py-1">Save</button>
        </form>

        <form onSubmit={logTripSubmit} className="border rounded-lg p-3 grid gap-2 bg-background">
          <div className="font-medium">Log Trip</div>
          <select 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            value={tripForm.vehicleId} 
            onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}
          >
            <option value="">Select vehicle</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>{v.name} - {v.plateNumber}</option>
            ))}
          </select>
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Route" 
            value={tripForm.route} 
            onChange={(e) => setTripForm({ ...tripForm, route: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Purpose" 
            value={tripForm.purpose} 
            onChange={(e) => setTripForm({ ...tripForm, purpose: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Fuel Used (L)" 
            value={tripForm.fuelUsed} 
            onChange={(e) => setTripForm({ ...tripForm, fuelUsed: e.target.value })} 
          />
          <button className="bg-secondary text-secondary-foreground rounded px-3 py-1">Save</button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat title="Total Vehicles" value={fleetStats.totalVehicles.toString()} index={0} />
        <Stat title="Total Trips" value={fleetStats.totalTrips.toString()} index={1} />
        <Stat title="Total Fuel Used" value={`${fleetStats.totalFuelUsed.toFixed(2)} L`} index={2} />
        <Stat title="Trucks" value={fleetStats.truckCount.toString()} index={3} />
      </div>

      <div className="mt-6 overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Plate</th>
              <th className="text-left p-3">Trips</th>
              <th className="text-left p-3">Fuel Used</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-3">{v.name}</td>
                <td className="p-3">{v.plateNumber}</td>
                <td className="p-3">{v.Trip.length}</td>
                <td className="p-3">{(v.Trip.reduce((acc, t) => acc + (t.fuelUsed ?? 0), 0)).toFixed(2)} L</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarLayout>
  );
}

function Stat({ title, value, index }: { title: string; value: string; index: number }) {
  const bgColor = index % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground';
  return (
    <div className={`border rounded-lg px-8 py-10 ${bgColor}`}>
      <div className="text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}