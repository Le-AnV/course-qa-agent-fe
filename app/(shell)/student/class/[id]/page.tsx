import { redirect } from "next/navigation";

export default async function StudentClassIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // /student/class/[id] không có content riêng — về overview để khỏi 404.
  redirect(`/student/class/${id}/overview`);
}
