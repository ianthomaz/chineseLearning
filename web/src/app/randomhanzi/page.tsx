import { redirect } from "next/navigation";

/** Legacy URL — hub vive em /praticar. */
export default function RandomHanziRedirectPage() {
  redirect("/praticar");
}
