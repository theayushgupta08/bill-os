import { WarehouseForm } from "../_components/WarehouseForm";

export default function EditWarehousePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit Warehouse</h2>
      </div>
      <WarehouseForm id={params.id} />
    </div>
  );
}
