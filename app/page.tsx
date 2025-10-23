"use client";

import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import { useSession } from "@/lib/SessionContext";
import Loading from "@/components/Loading";

export default function HomePage() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <Loading/>
    );
  }

  return session ? <Dashboard /> : <LandingPage />;
}
