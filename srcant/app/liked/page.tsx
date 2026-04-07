import { redirect } from "next/navigation";

export default function LikedPage() {
  redirect("/library?tab=liked");
}