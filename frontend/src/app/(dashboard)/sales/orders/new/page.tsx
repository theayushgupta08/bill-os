"use client";

import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function NewSalesOrderPage() {
  const router = useRouter();
  
  const handleCreateMock = async () => {
    try {
      const customers = await fetchApi("/api/v1/customers");
      const products = await fetchApi("/api/v1/products");
      
      if (customers.length === 0 || products.length === 0) {
        alert("Please ensure you have at least one customer and one product created.");
        return;
      }

      const payload = {
        customerId: customers[0].id,
        orderDate: new Date().toISOString().split('T')[0],
        notes: "Auto-generated mockup Sales Order",
        lines: [
          {
            productId: products[0].id,
            quantity: 5,
            unitPrice: products[0].basePrice || 100.00
          }
        ]
      };

      await fetchApi("/api/v1/sales-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      router.push("/sales/orders");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create Sales Order");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Sales Order</h2>
      <p className="text-muted-foreground">This is a mock generator for V1 testing. Press the button to create a mock Sales Order.</p>
      <Button onClick={handleCreateMock}>Generate Test Sales Order</Button>
    </div>
  );
}
