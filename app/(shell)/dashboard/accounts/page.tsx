"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IMPORTABLE_ROLES } from "@/components/ui/nav-config";
import { adminApi, type AdminUser, type ClassSection } from "@/lib/admin-api";

/**
 * Accounts (AC-03, AC-11, AC-12). Every account is created by an admin —
 * no self-registration. Deactivate blocks login; reset emails a new password;
 * delete needs confirmation and the last admin is protected.
 */
export default function AccountsPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("student");
  const [classCode, setClassCode] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<AdminUser | null>(null);

  // NOTE: no synchronous setState here — this runs inside a useEffect,
  // so all state updates happen after the await (async continuation).
  // Event handlers below clear `error` themselves before reloading.
  const load = React.useCallback(async () => {
    try {
      const [u, k] = await Promise.all([adminApi.users(), adminApi.classes()]);
      setUsers(u);
      setClasses(k);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      const created = await adminApi.createUser(
        username.trim(),
        email.trim(),
        role,
        classCode.trim() || undefined,
      );
      setUsername("");
      setEmail("");
      setClassCode("");
      setNotice(`Account ${created.email} created — credentials emailed.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  }

  async function toggleActive(user: AdminUser) {
    setError(null);
    try {
      await adminApi.setActive(user.id, !user.is_active);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function resetPassword(user: AdminUser) {
    setError(null);
    try {
      const res = await adminApi.resetPassword(user.id);
      setNotice(`New password emailed to ${res.emailed_to}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);
    try {
      await adminApi.deleteUser(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Trainers and teaching assistants must be assigned to a class before they can log in (AC-03).
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      <Card>
        <CardHeader>
          <CardTitle>New account</CardTitle>
          <CardDescription>
            Pick a role and a class. The password is generated and emailed — you never see it (AC-07).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAccount} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Username
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Gmail
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Role
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {IMPORTABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "teaching_assistant" ? "teaching assistant" : r}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Class
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
              >
                <option value="">Select a class…</option>
                {classes.map((k) => (
                  <option key={k.id} value={k.code}>
                    {k.code}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Create &amp; email credentials</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {users.length === 0 ? (
        <EmptyState title="No accounts yet" description="Create the first account above, or bulk-import a class." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.student_code ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{u.class_code ?? "—"}</TableCell>
                    <TableCell>
                      {u.is_active ? (
                        <Badge>active</Badge>
                      ) : (
                        <Badge variant="destructive">deactivated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => void toggleActive(u)}>
                          {u.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void resetPassword(u)}>
                          Reset password
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setPendingDelete(u)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.email}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. The last admin account cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
