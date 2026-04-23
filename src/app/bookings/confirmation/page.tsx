import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookingConfirmationView } from "@/components/booking-confirmation-view";

export const metadata: Metadata = {
  title: "Reserva confirmada",
};

function ConfirmationInner({ bookingId }: { bookingId: string }) {
  return <BookingConfirmationView bookingId={bookingId} />;
}

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">
        Missing booking id. Return to{" "}
        <Link className="underline" href="/">
          home
        </Link>
        .
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Loading confirmation…</div>}>
      <ConfirmationInner bookingId={id} />
    </Suspense>
  );
}
