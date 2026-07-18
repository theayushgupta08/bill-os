"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileJson } from "lucide-react";

export default function GstReportsPage() {
  const [hsnSummary, setHsnSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingJson, setDownloadingJson] = useState(false);

  useEffect(() => {
    loadHsnSummary();
  }, []);

  const loadHsnSummary = async () => {
    try {
      const data: any = await api.get("/reports/gst/hsn-summary");
      setHsnSummary(data);
    } catch (error) {
      console.error("Failed to load HSN summary", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadEInvoiceJson = async (invoiceId: string) => {
    setDownloadingJson(true);
    try {
      const res: any = await api.get(`/reports/gst/einvoice/${invoiceId}`, { responseType: 'blob' });
      const blob = new Blob([res]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `einvoice_${invoiceId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Failed to download JSON");
    } finally {
      setDownloadingJson(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GST Reports</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>HSN Summary</CardTitle>
            <CardDescription>Generated HSN-wise tax summary for the current period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md mb-4">
              Status: {hsnSummary?.status} <br/>
              {hsnSummary?.data}
            </div>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>E-Invoice JSON Generation</CardTitle>
            <CardDescription>Generate FORM INV-01 compliant JSON payload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="text-sm text-muted-foreground p-4 bg-yellow-100 dark:bg-yellow-900 rounded-md">
              Full NIC schema generation is deferred to the E-Invoicing Sprint. You can download the placeholder below.
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Enter Invoice ID" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" id="invoiceIdInput" />
              <Button 
                onClick={() => {
                  const input = document.getElementById('invoiceIdInput') as HTMLInputElement;
                  if (input && input.value) {
                    downloadEInvoiceJson(input.value);
                  } else {
                    alert("Please enter an Invoice ID");
                  }
                }}
                disabled={downloadingJson}
              >
                <FileJson className="mr-2 h-4 w-4" /> Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
