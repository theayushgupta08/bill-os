import { WarehouseForm } from "../_components/WarehouseForm";

export default async function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: params is a Promise; reading params.id directly yields undefined (and the form falls into create mode)
  const { id } = await params;
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit Warehouse</h2>
      </div>
      <WarehouseForm id={id} />
    </div>
  );
}
