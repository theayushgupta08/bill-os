import ProductCategoryForm from "../_components/ProductCategoryForm";

export default function NewProductCategoryPage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">New Category</h1>
      </div>
      <div className="rounded-md border bg-card text-card-foreground p-6 shadow-sm">
        <ProductCategoryForm />
      </div>
    </div>
  );
}
