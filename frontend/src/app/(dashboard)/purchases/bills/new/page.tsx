"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function NewPurchaseBillPage() {
  const router = useRouter();
  
  // Note: For brevity in this exercise, this is a placeholder UI for the complex multi-line PB form.
  
  const handleCreateMock = async () => {
    try {
      const customers = await fetchApi("/api/v1/customers");
      const products = await fetchApi("/api/v1/products");
      const taxes = await fetchApi("/api/v1/tax-rates");
      const warehouses = await fetchApi("/api/v1/warehouses");
      
      if (customers.length === 0 || products.length === 0 || warehouses.length === 0) {
        alert("Please ensure you have suppliers, products, and warehouses created.");
        return;
      }

      const payload = {
        supplierId: customers[0].id,
        billNumber: "BILL-" + Math.floor(Math.random() * 10000),
        billDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        notes: "Auto-generated mockup Bill (should update stock)",
        lines: [
          {
            productId: products[0].id,
            warehouseId: warehouses[0].id,
            taxRateId: taxes.length > 0 ? taxes[0].id : null,
            quantity: 50, // Should add 50 to stock
            unitPrice: products[0].basePrice || 45.00
          }
        ]
      };

      await fetchApi("/api/v1/purchase-bills", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      router.push("/purchases/bills");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create Bill");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Purchase Bill</h2>
      <p className="text-muted-foreground">The full multi-line form is under construction. Use the button below to generate a test Bill that will automatically update inventory.</p>
      
      <Button onClick={handleCreateMock}>Generate Test Bill (Auto-Stock)</Button>
    </div>
  );
}
