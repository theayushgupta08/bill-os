"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProductCategoryFormProps {
  categoryId?: string; // If provided, it's in edit mode
}

export default function ProductCategoryForm({ categoryId }: ProductCategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories-dropdown"],
    queryFn: async () => {
      const data: any = await apiClient.get("/product-categories");
      return data.filter((c: any) => c.id !== categoryId);
    },
  });

  const { data: category, isLoading: isFetching } = useQuery({
    queryKey: ["product-category", categoryId],
    queryFn: async () => {
      const data: any = await apiClient.get(`/product-categories/${categoryId}`);
      return data;
    },
    enabled: !!categoryId,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        parentId: category.parentId || "",
      });
    }
  }, [category]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = { ...data, parentId: data.parentId || null };
      if (categoryId) {
        return apiClient.put(`/product-categories/${categoryId}`, payload);
      } else {
        return apiClient.post("/product-categories", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories-dropdown"] });
      router.push("/product-categories");
    },
    onError: (error) => {
      console.error("Failed to save category:", error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentId">Parent Category</Label>
          <select
            id="parentId"
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">None</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/product-categories")} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Category"}
        </Button>
      </div>
    </form>
  );
}
