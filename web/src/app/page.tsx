import { HomeContent } from "@/components/HomeContent";
import { getBlocks } from "@/lib/blocks";



export default function HomePage() {
  return <HomeContent blocks={getBlocks()} />;
}
