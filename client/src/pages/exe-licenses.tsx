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
  exeName: string;
  apiKey: string;
  daysValid: number;
  expiresAt: string;
  lastConnectedAt: string | null;
  status: string;
  createdAt: string;
}

export default function ExeLicensesPage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    exeName: "",
    daysValid: 30,
  });

  // Fetch EXE licenses
  const { data: licenses, isLoading, refetch } = useQuery({
    queryKey: ["exe-licenses"],
    queryFn: async () => {
      const res = await apiRequest("/api/exe-licenses");
      return res.json() as Promise<ExeLicense[]>;
    },
  });

  // Create EXE license
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("/api/exe-licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create license");
      return res.json();
    },
    onSuccess: (newLicense) => {
      toast({
        title: "✅ EXE License Created",
        description: `API Key: ${newLicense.apiKey}`,
      });
      queryClient.invalidateQueries({ queryKey: ["exe-licenses"] });
      setOpenDialog(false);
      setFormData({ exeName: "", daysValid: 30 });
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

  // Delete EXE license
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
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    if (status !== "active") return "destructive";
    if (new Date(expiresAt) < new Date()) return "destructive";
    return "default";
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Only administrators can manage EXE licenses
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
            Manage API keys for your desktop applications
          </p>
        </div>
        <Button onClick={() => setOpenDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create License
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Licenses Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EXE Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Last Connected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12" />
                  </TableCell>
                </TableRow>
              ) : licenses && licenses.length > 0 ? (
                licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      {license.exeName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {license.apiKey.slice(0, 12)}...
                        </code>
                        <button
                          onClick={() => handleCopyKey(license.apiKey)}
                          className="hover:opacity-70"
                          title="Copy full key"
                        >
                          {copiedKey === license.apiKey ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(license.expiresAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(license.lastConnectedAt)}
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
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No EXE licenses yet. Create one to get started.
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
              <label className="text-sm font-medium">EXE Name *</label>
              <Input
                placeholder="e.g., game.exe"
                value={formData.exeName}
                onChange={(e) =>
                  setFormData({ ...formData, exeName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Days Valid *</label>
              <Input
                type="number"
                placeholder="30"
                value={formData.daysValid}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daysValid: parseInt(e.target.value) || 30,
                  })
                }
                min="1"
                max="365"
              />
              <p className="text-xs text-muted-foreground mt-1">
                License will expire after {formData.daysValid} days
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.exeName || createMutation.isPending}
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
              This will revoke the EXE license and prevent the application from
              connecting. This action cannot be undone.
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
