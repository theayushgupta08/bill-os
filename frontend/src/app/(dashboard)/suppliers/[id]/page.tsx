import SupplierForm from "../_components/SupplierForm";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: params is a Promise; reading params.id directly yields undefined (and the form falls into create mode)
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Edit Supplier</h1>
      </div>
      <div className="rounded-md border bg-card text-card-foreground p-6 shadow-sm">
        <SupplierForm supplierId={id} />
      </div>
    </div>
  );
}
