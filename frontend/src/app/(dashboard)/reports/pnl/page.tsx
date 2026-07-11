"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfitAndLossPage() {
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReport = () => {
    setLoading(true);
    let url = "/api/v1/reports/pnl";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    apiClient(url, { method: "GET" })
      .then((res: any) => setData(res))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-3xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profit & Loss</h2>
      </div>

      <div className="flex space-x-2">
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Start Date" />
        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End Date" />
        <Button onClick={fetchReport} disabled={loading}>Filter</Button>
      </div>

      {data && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Income Statement Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-green-600">Total Revenue</span>
                <span className="font-bold">₹{data.totalRevenue?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-red-600">Total Purchases/Expenses</span>
                <span className="font-bold">₹{data.totalPurchases?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-4">
                <span className="font-bold text-lg">Net Profit</span>
                <span className={`font-bold text-lg ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{data.netProfit?.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
