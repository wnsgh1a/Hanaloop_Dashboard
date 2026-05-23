import { redirect } from "next/navigation";

export default function SwaggerPage() {
  redirect("/api-docs");
}
