"use client";

import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function NewSalesInvoicePage() {
  const router = useRouter();
  
  const handleCreateMock = async () => {
    try {
      const customers = await fetchApi("/api/v1/customers");
      const products = await fetchApi("/api/v1/products");
      const warehouses = await fetchApi("/api/v1/warehouses");
      
      if (customers.length === 0 || products.length === 0 || warehouses.length === 0) {
        alert("Please ensure you have customers, products, and warehouses created.");
        return;
      }

      const payload = {
        customerId: customers[0].id,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "Auto-generated mockup Sales Invoice (deducts stock)",
        lines: [
          {
            productId: products[0].id,
            warehouseId: warehouses[0].id,
            quantity: 2,
            unitPrice: products[0].basePrice || 100.00
          }
        ]
      };

      await fetchApi("/api/v1/sales-invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      router.push("/sales/invoices");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create Sales Invoice");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Sales Invoice</h2>
      <p className="text-muted-foreground">This is a mock generator for V1 testing. Press the button to create a mock Sales Invoice that automatically deducts stock.</p>
      <Button onClick={handleCreateMock}>Generate Test Sales Invoice (Auto-Deduct Stock)</Button>
    </div>
  );
}
