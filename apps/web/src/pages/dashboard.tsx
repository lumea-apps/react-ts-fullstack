import { useNavigate } from "react-router-dom";
import { useSession, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, User } from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Show loading state
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session?.user) {
    navigate("/login");
    return null;
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      {/* Header */}
      <header className="border-b" data-testid="dashboard-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut} data-testid="dashboard-signout-button">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Profile Card */}
          <Card data-testid="dashboard-profile-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium" data-testid="dashboard-user-name">{user.name}</p>
                  <p className="text-sm text-muted-foreground" data-testid="dashboard-user-email">{user.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs" data-testid="dashboard-user-id">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email verified</span>
                  <span>{user.emailVerified ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Welcome Card */}
          <Card className="md:col-span-2" data-testid="dashboard-welcome-card">
            <CardHeader>
              <CardTitle data-testid="dashboard-welcome-title">Welcome, {user.name || "User"}!</CardTitle>
              <CardDescription>
                You are now signed in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is a protected dashboard page. Only authenticated users can
                see this content. You can add your application features here.
              </p>
              <div className="mt-4 rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Quick Start:</p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  <li>Add your own components and features</li>
                  <li>Customize the dashboard layout</li>
                  <li>Connect to your API endpoints</li>
                  <li>Manage user settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
