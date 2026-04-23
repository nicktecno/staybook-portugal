import { StaySearch } from "@/components/stay-search";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <StaySearch />
    </div>
  );
}
