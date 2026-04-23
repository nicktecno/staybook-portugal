import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/checkout-view";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your booking.",
};

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Loading checkout…</div>}>
      <CheckoutView stayId={id} />
    </Suspense>
  );
}
