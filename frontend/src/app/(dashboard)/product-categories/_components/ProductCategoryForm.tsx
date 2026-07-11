"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import fetchApi from "@/lib/api-client";

interface ProductCategoryFormProps {
  categoryId?: string; // If provided, it's in edit mode
}

export default function ProductCategoryForm({ categoryId }: ProductCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!categoryId);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  });

  useEffect(() => {
    loadParentCategories();
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  const loadParentCategories = async () => {
    try {
      const data = await fetchApi("/product-categories");
      // filter out self if editing
      setCategories(data.filter((c: any) => c.id !== categoryId));
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadCategory = async () => {
    try {
      const data = await fetchApi(`/product-categories/${categoryId}`);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        parentId: data.parentId || "",
      });
    } catch (error) {
      console.error("Failed to load category:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // payload
      const payload = { ...formData, parentId: formData.parentId || null };

      if (categoryId) {
        await fetchApi(`/product-categories/${categoryId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/product-categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/product-categories");
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
          {/* using native select for simplicity */}
          <select
            id="parentId"
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/product-categories")}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Category"}
        </Button>
      </div>
    </form>
  );
}
