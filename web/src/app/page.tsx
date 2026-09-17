import { HomeContent } from "@/components/HomeContent";
import { getBlockIndexEntries } from "@/lib/blocks";

export default function HomePage() {
  return <HomeContent blocks={getBlockIndexEntries()} />;
}
