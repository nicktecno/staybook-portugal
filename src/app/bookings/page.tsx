import type { Metadata } from "next";
import { MyBookingsView } from "@/components/my-bookings-view";

export const metadata: Metadata = {
  title: "My bookings",
};

export default function BookingsPage() {
  return <MyBookingsView />;
}
