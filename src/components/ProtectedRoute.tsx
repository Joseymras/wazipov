import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile, signOut } = useAuth() as any;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.suspended) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="font-display text-3xl font-bold">Your account is paused.</h1>
      <p className="text-muted-foreground">Please reach us through the contact page to restore access.</p>
      <div className="flex gap-3"><a href="/contact" className="underline">Contact us</a><button className="underline" onClick={() => signOut()}>Sign out</button></div>
    </div>
  );
  return <>{children}</>;
}
