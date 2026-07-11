"use client";

import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function NewQuotationPage() {
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
        quoteDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "Auto-generated mockup Quotation",
        lines: [
          {
            productId: products[0].id,
            quantity: 5,
            unitPrice: products[0].basePrice || 100.00
          }
        ]
      };

      await fetchApi("/api/v1/quotations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      router.push("/sales/quotes");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create Quotation");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Quotation</h2>
      <p className="text-muted-foreground">This is a mock generator for V1 testing. Press the button to create a mock Quotation.</p>
      <Button onClick={handleCreateMock}>Generate Test Quotation</Button>
    </div>
  );
}
