import { redirect } from "next/navigation";

/** Old bookmark `/vocabulary/23` (PDF list) → dedicated Visuais area. */
export default function VocabularyPdfLegacyRedirect() {
  redirect("/visuals");
}
