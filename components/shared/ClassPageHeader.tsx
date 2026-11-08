import * as React from "react";
import { WorkspacePageHeader } from "@/components/shared/WorkspacePageHeader";

/**
 * One tinted header surface for every class tab, so a page title never floats
 * on the grey workspace background. The actions sit on the same baseline as
 * the title and wrap below it on narrow screens.
 */
export function ClassPageHeader({
  id,
  title,
  subtitle,
  badge,
  actions,
  className,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <WorkspacePageHeader
      id={id}
      title={title}
      subtitle={subtitle}
      badge={badge}
      actions={actions}
      className={className}
    />
  );
}
