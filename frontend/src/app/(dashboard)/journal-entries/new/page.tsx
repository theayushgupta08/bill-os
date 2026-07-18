import { JournalEntryForm } from "@/features/accounts/components/journal-entry-form";

export default function NewJournalEntryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">New Journal Entry</h2>
      </div>
      <JournalEntryForm />
    </div>
  );
}
