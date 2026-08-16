import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Copy, Check } from "lucide-react";

interface ExeLicense {
  id: string;
  licenseKey: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  note: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ExeLicensesPage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    expiresAt: "",
    maxUses: 0,
    note: "",
  });

  // Fetch licenses
  const { data: licenses, isLoading, refetch } = useQuery({
    queryKey: ["exe-licenses"],
    queryFn: async () => {
      const res = await apiRequest("/api/exe-licenses");
      return res.json() as Promise<ExeLicense[]>;
    },
  });

  // Create license
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("/api/exe-licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: new Date(data.expiresAt),
          maxUses: parseInt(String(data.maxUses)) || 0,
          note: data.note,
        }),
      });
      if (!res.ok) throw new Error("Failed to create license");
      return res.json();
    },
    onSuccess: (newLicense) => {
      toast({
        title: "✅ License Created",
        description: `Key: ${newLicense.licenseKey}`,
      });
      queryClient.invalidateQueries({ queryKey: ["exe-licenses"] });
      setOpenDialog(false);
      setFormData({ expiresAt: "", maxUses: 0, note: "" });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to create",
        variant: "destructive",
      });
    },
  });

  // Delete license
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/exe-licenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ License Deleted",
        description: "EXE license has been revoked",
      });
      queryClient.invalidateQueries({ queryKey: ["exe-licenses"] });
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    if (status !== "active") return "destructive";
    if (new Date(expiresAt) < new Date()) return "destructive";
    return "default";
  };

  const daysUntilExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return "Expired";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Only administrators can manage licenses
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EXE Licenses</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage license keys for your applications
          </p>
        </div>
        <Button onClick={() => setOpenDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create License
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Licenses</div>
          <div className="text-2xl font-bold">{licenses?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {licenses?.filter(
              (l) =>
                l.status === "active" && new Date(l.expiresAt) > new Date()
            ).length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Expired</div>
          <div className="text-2xl font-bold text-red-600">
            {licenses?.filter((l) => new Date(l.expiresAt) <= new Date())
              .length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Uses</div>
          <div className="text-2xl font-bold">
            {licenses?.reduce((sum, l) => sum + l.usedCount, 0) || 0}
          </div>
        </Card>
      </div>

      {/* Licenses Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Max Uses</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-12" />
                  </TableCell>
                </TableRow>
              ) : licenses && licenses.length > 0 ? (
                licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {license.licenseKey}
                        </code>
                        <button
                          onClick={() => handleCopyKey(license.licenseKey)}
                          className="hover:opacity-70"
                          title="Copy license key"
                        >
                          {copiedKey === license.licenseKey ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(license.expiresAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {daysUntilExpiry(license.expiresAt)}
                    </TableCell>
                    <TableCell>
                      {license.maxUses === 0 ? "∞" : license.maxUses}
                    </TableCell>
                    <TableCell>{license.usedCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {license.lastUsedAt
                        ? formatDate(license.lastUsedAt)
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusColor(
                          license.status,
                          license.expiresAt
                        )}
                      >
                        {new Date(license.expiresAt) < new Date()
                          ? "Expired"
                          : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setDeleteId(license.id)}
                        className="text-destructive hover:opacity-70"
                        title="Delete license"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No licenses yet. Create one to get started.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create License Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create EXE License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Expiry Date *</label>
              <Input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                When this license should expire
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Max Uses (Optional)</label>
              <Input
                type="number"
                placeholder="0 = unlimited"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUses: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of EXEs that can use this key (0 = unlimited)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Note (Optional)</label>
              <Input
                placeholder="e.g., customer name or project"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.expiresAt || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create License"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the license key and prevent EXEs from connecting.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
