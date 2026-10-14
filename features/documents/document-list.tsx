"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACCEPTED_TYPES,
  formatFileSize,
  type ClassOption,
  type DocumentFilters,
  type DocumentItem,
} from "@/lib/documents";

const STATUS_VARIANT: Record<DocumentItem["status"], "default" | "secondary" | "destructive"> = {
  indexed: "default",
  processing: "secondary",
  pending: "secondary",
  rejected: "destructive",
  failed: "destructive",
};

export type { DocumentFilters };

export function DocumentList({
  documents,
  classes,
  total,
  page,
  pageSize,
  filters,
  loading = false,
  error = null,
  approvingId = null,
  onFiltersChange,
  onPageChange,
  onApprove,
}: {
  documents: DocumentItem[];
  classes: ClassOption[];
  total: number;
  page: number;
  pageSize: number;
  filters: DocumentFilters;
  loading?: boolean;
  error?: string | null;
  approvingId?: string | null;
  onFiltersChange: (next: DocumentFilters) => void;
  onPageChange: (page: number) => void;
  onApprove?: (documentId: string) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Documents ({total}){loading ? " — loading…" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search by file name"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            aria-label="Search by file name"
          />
          <Select
            value={filters.classId}
            onValueChange={(v) => onFiltersChange({ ...filters, classId: v })}
          >
            <SelectTrigger aria-label="Filter by class">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.fileType}
            onValueChange={(v) => onFiltersChange({ ...filters, fileType: v })}
          >
            <SelectTrigger aria-label="Filter by file type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ACCEPTED_TYPES.map((t) => (
                <SelectItem key={t.extension} value={t.extension}>
                  {t.extension}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => onFiltersChange({ ...filters, status: v })}
          >
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending approval</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="indexed">Indexed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {documents.length === 0 && !loading ? (
          <EmptyState
            title="No documents found"
            description="Try a different search term or filter."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploader</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.fileName}</TableCell>
                  <TableCell>{d.fileType}</TableCell>
                  <TableCell>{formatFileSize(d.sizeBytes)}</TableCell>
                  <TableCell>{d.uploaderId}</TableCell>
                  <TableCell>{d.className}</TableCell>
                  <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[d.status]}>
                      {d.status === "pending" ? "pending approval" : d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {d.status === "pending" && onApprove && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={approvingId === d.id || loading}
                        onClick={() => onApprove(d.id)}
                      >
                        {approvingId === d.id ? "Approving…" : "Approve"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-input px-3 py-1 disabled:opacity-50"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-input px-3 py-1 disabled:opacity-50"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
