import { Metadata } from "next";
import { DocsContent } from "@/components/docs/docs-content";

export const metadata: Metadata = {
  title: "Radia Documentation",
  description: "Complete documentation for the Radia HR platform",
};

export default function DocsPage() {
  return <DocsContent />;
}
