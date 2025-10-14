import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent } from "react";

export default function FleetPage() {
  const utils = trpc.useUtils();
  const { data: vehicles } = trpc.fleet.getVehicles.useQuery();
  const addVehicle = trpc.fleet.addVehicle.useMutation({ onSuccess: () => utils.fleet.getVehicles.invalidate() });
  const logTrip = trpc.fleet.logTrip.useMutation({ onSuccess: () => utils.fleet.getVehicles.invalidate() });

  const [vehicleForm, setVehicleForm] = useState({ name: "", type: "Truck", plateNumber: "" });
  const [tripForm, setTripForm] = useState({ vehicleId: "", route: "", purpose: "Delivery", fuelUsed: "" });

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
        <form onSubmit={addVehicleSubmit} className="border rounded-lg p-3 grid gap-2">
          <div className="font-medium">Add Vehicle</div>
          <input className="border rounded px-2 py-1" placeholder="Name" value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Type" value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Plate Number" value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} />
          <button className="bg-black text-white rounded px-3 py-1">Save</button>
        </form>

        <form onSubmit={logTripSubmit} className="border rounded-lg p-3 grid gap-2">
          <div className="font-medium">Log Trip</div>
          <select className="border rounded px-2 py-1" value={tripForm.vehicleId} onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}>
            <option value="">Select vehicle</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>{v.name} - {v.plateNumber}</option>
            ))}
          </select>
          <input className="border rounded px-2 py-1" placeholder="Route" value={tripForm.route} onChange={(e) => setTripForm({ ...tripForm, route: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Purpose" value={tripForm.purpose} onChange={(e) => setTripForm({ ...tripForm, purpose: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Fuel Used (L)" value={tripForm.fuelUsed} onChange={(e) => setTripForm({ ...tripForm, fuelUsed: e.target.value })} />
          <button className="bg-black text-white rounded px-3 py-1">Save</button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto border rounded-lg">
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


