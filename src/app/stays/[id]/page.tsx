import type { Metadata } from "next";
import { StayDetailsView } from "@/components/stay-details-view";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Stay ${id}`,
    description: "Availability, reviews, and booking for this stay.",
  };
}

export default async function StayPage({ params }: PageProps) {
  const { id } = await params;
  return <StayDetailsView stayId={id} />;
}
