import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Download, Trash2, Shield, User, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AccountSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const exportDataMutation = trpc.auth.exportData.useMutation({
    onSuccess: (data) => {
      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully', {
        description: 'Your data has been downloaded to your device.',
      });
    },
    onError: (error) => {
      toast.error('Export failed', {
        description: error.message,
      });
    },
  });

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success('Account deleted', {
        description: 'Your account and all data have been permanently deleted.',
      });
      // Redirect to home page after a short delay
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
    onError: (error) => {
      toast.error('Deletion failed', {
        description: error.message,
      });
      setIsDeleting(false);
    },
  });

  const handleExportData = () => {
    exportDataMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Incorrect confirmation', {
        description: 'Please type "DELETE MY ACCOUNT" exactly to confirm.',
      });
      return;
    }

    setIsDeleting(true);
    deleteAccountMutation.mutate({ confirmation: 'DELETE MY ACCOUNT' });
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information and privacy settings
          </p>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={user.name || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Login Method</Label>
                <Input value={user.loginMethod || 'OAuth'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user.role || 'user'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input
                  value={
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'
                  }
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Last Sign In</Label>
                <Input
                  value={
                    user.lastSignedIn
                      ? new Date(user.lastSignedIn).toLocaleDateString()
                      : 'Unknown'
                  }
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Data Privacy & GDPR</CardTitle>
                <CardDescription>
                  Export or delete your personal data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Data */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Export Your Data</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of all your personal data in JSON format. This
                  includes your projects, deployments, conversations, and usage
                  analytics.
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={exportDataMutation.isPending}
                  variant="outline"
                >
                  {exportDataMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Preparing Export...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">
                    Delete Account
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This
                  action cannot be undone. All your projects, deployments, and
                  data will be permanently removed.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This action cannot be undone. This will permanently
                          delete your account and remove all your data from our
                          servers.
                        </p>
                        <p className="font-semibold">
                          The following data will be permanently deleted:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>All projects and code</li>
                          <li>All deployments</li>
                          <li>All API keys and credentials</li>
                          <li>All conversations and chat history</li>
                          <li>All usage analytics and cost tracking data</li>
                          <li>Your account information</li>
                        </ul>
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="delete-confirmation">
                            Type{' '}
                            <span className="font-mono font-bold">
                              DELETE MY ACCOUNT
                            </span>{' '}
                            to confirm:
                          </Label>
                          <Input
                            id="delete-confirmation"
                            value={deleteConfirmation}
                            onChange={(e) =>
                              setDeleteConfirmation(e.target.value)
                            }
                            placeholder="DELETE MY ACCOUNT"
                            className="font-mono"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setDeleteConfirmation('')}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={
                          deleteConfirmation !== 'DELETE MY ACCOUNT' ||
                          isDeleting
                        }
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Legal & Privacy</CardTitle>
            <CardDescription>
              Review our legal documents and privacy policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" asChild className="justify-start">
                <a href="/legal" target="_blank">
                  Terms of Service
                </a>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <a href="/legal" target="_blank">
                  Privacy Policy
                </a>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <a href="/legal" target="_blank">
                  Cookie Policy
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
