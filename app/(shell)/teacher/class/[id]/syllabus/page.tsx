"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { SyllabusRoadmap } from "@/components/shared/SyllabusTable";
import { ClassMaterials } from "@/features/documents/class-materials";

export default function ClassSyllabusPage() {
  const params = useParams();
  const id = params.id as string;
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div>
      <SyllabusRoadmap classId={id} isTeacher refreshKey={refreshKey} />
      <ClassMaterials
        classId={id}
        onIndexedChange={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
