import { redirect } from "next/navigation";

export default function TaxSettingsRedirectPage() {
  redirect("/settings/taxes");
}
