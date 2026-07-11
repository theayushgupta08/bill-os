import { AccountForm } from "../_components/AccountForm";

export default function EditAccountPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit Account</h2>
      </div>
      <AccountForm id={params.id} />
    </div>
  );
}
