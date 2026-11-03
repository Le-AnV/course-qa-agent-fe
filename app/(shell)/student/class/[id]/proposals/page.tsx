"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

/** The old mock "My Proposals" page now lives at the real My Tickets page. */
export default function StudentProposalsRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  React.useEffect(() => {
    if (id) router.replace(`/student/class/${id}/tickets`);
  }, [id, router]);

  return null;
}
