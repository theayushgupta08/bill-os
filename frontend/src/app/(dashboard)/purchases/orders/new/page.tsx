"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  
  // Note: For brevity in this exercise, this is a placeholder UI for the complex multi-line PO form.
  
  const handleCreateMock = async () => {
    try {
      const customers = await fetchApi("/api/v1/customers");
      const products = await fetchApi("/api/v1/products");
      const taxes = await fetchApi("/api/v1/tax-rates");
      
      if (customers.length === 0 || products.length === 0) {
        alert("Please ensure you have at least one supplier and one product created.");
        return;
      }

      const payload = {
        supplierId: customers[0].id,
        poNumber: "PO-" + Math.floor(Math.random() * 10000),
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: new Date().toISOString().split('T')[0],
        notes: "Auto-generated mockup PO",
        lines: [
          {
            productId: products[0].id,
            taxRateId: taxes.length > 0 ? taxes[0].id : null,
            quantity: 10,
            unitPrice: products[0].basePrice || 50.00
          }
        ]
      };

      await fetchApi("/api/v1/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      router.push("/purchases/orders");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create PO");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Purchase Order</h2>
      <p className="text-muted-foreground">The full multi-line form is under construction. Use the button below to generate a test PO.</p>
      
      <Button onClick={handleCreateMock}>Generate Test PO</Button>
    </div>
  );
}
