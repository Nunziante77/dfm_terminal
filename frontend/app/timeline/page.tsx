import { redirect } from "next/navigation";

// Timeline is now consolidated into the Events surface as the TIMELINE tab.
export default function TimelinePage() {
  redirect("/events");
}
