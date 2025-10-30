"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface ServiceConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: "github" | "vercel"; // removed 'supabase' provider support
  projectId?: string;
}
interface UserUpdate {
  id: string;
  githubToken?: string | null;
  githubConnected?: boolean;
  vercelToken?: string | null;
  vercelConnected?: boolean;
}

interface ServiceToken {
  id: string;
  provider: string;
  token: string;
  name?: string;
  created_at: string;
  last_used?: string;
}

interface ServiceToken {
  id: string;
  provider: string;
  token: string;
  name?: string;
  created_at: string;
  last_used?: string;
}

export default function ServiceConnectionModal({
  isOpen,
  onClose,
  provider,
}: ServiceConnectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState<ServiceToken | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Load saved token (githubToken / vercelToken) from users table
  useEffect(() => {
    if (!isOpen) return;

    const loadSavedToken = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          setSavedToken(null);
          return;
        }

        const userId = session.user.id;

        const { data, error } = await supabase
          .from("users")
          .select("id, githubToken, vercelToken, githubConnected, vercelConnected, created_at")
          .eq("id", userId)
          .single();

        if (error) {
          console.warn("Failed to fetch user tokens:", error.message || error);
          setSavedToken(null);
          return;
        }

        const providerToken = provider === "github" ? data.githubToken : data.vercelToken;

        if (!providerToken) {
          setSavedToken(null);
          return;
        }

        setSavedToken({
          id: data.id,
          provider,
          token: providerToken,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Token`,
          created_at: data.created_at ?? new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to load saved token:", err);
        setSavedToken(null);
      }
    };

    loadSavedToken();
  }, [isOpen, provider]);

const handleSaveToken = async () => {
  if (!token.trim()) {
    alert("Please enter a valid token");
    return;
  }

  setIsLoading(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const userId = session.user.id;

    // Build the update object for the users table
    const updateObj: Partial<UserUpdate> = {};
    if (provider === "github") {
      updateObj.githubToken = token.trim();
      updateObj.githubConnected = true;
    } else if (provider === "vercel") {
      updateObj.vercelToken = token.trim();
      updateObj.vercelConnected = true;
    }

    // ✅ Use update instead of upsert
    const { data, error } = await supabase
      .from("users")
      .update(updateObj)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    setSavedToken({
      id: data.id,
      provider,
      token: token.trim(),
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Token`,
      created_at: data.created_at ?? new Date().toISOString(),
    });

    setToken("");
    setShowTokenInput(false);
    console.log("✅ Token updated successfully.");
  } catch (error) {
    console.error("❌ Failed to update token:", error);
    alert("Failed to update token. Check console for details.");
  } finally {
    setIsLoading(false);
  }
};


  // Delete (null out) token column in users table
  const handleDeleteToken = async () => {
    if (!confirm("Are you sure you want to delete this token?")) return;

    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error("Not authenticated");
      }

      const userId = session.user.id;

      const updateObj: Partial<UserUpdate> = {};
      if (provider === "github") {
        updateObj.githubToken = null;
        updateObj.githubConnected = false;
      } else if (provider === "vercel") {
        updateObj.vercelToken = null;
        updateObj.vercelConnected = false;
      }

      const { error } = await supabase.from("users").update(updateObj).eq("id", userId);

      if (error) throw error;

      setSavedToken(null);
      alert("Token deleted successfully!");
    } catch (err) {
      console.error("Failed to delete token:", err);
      alert("Failed to delete token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderInfo = () => {
    if (provider === "github") {
      return {
        title: "GitHub",
        description:
          "Connect with your GitHub Personal Access Token to create repositories and manage code",
        tokenUrl: "https://github.com/settings/tokens",
        tokenName: "Personal Access Token",
        icon: (
          <svg width="32" height="32" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
              fill="currentColor"
            />
          </svg>
        ),
      };
    }

    // provider === "vercel"
    return {
      title: "Vercel",
      description: "Connect with your Vercel API Token to deploy projects and manage domains",
      tokenUrl: "https://vercel.com/account/tokens",
      tokenName: "API Token",
      icon: (
        <svg width="32" height="32" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
        </svg>
      ),
    };
  };

  const providerInfo = getProviderInfo();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-gray-700 dark:text-gray-300">{providerInfo.icon}</div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {providerInfo.title} {providerInfo.tokenName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{providerInfo.description}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {savedToken ? (
                // Token is saved - show connection status and actions
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Token Connected</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Name: {savedToken.name}</p>
                      <p>Provider: {savedToken.provider}</p>
                      <p className="text-xs mt-1">Added: {new Date(savedToken.created_at).toLocaleString()}</p>
                      {savedToken.last_used && <p className="text-xs">Last used: {new Date(savedToken.last_used).toLocaleString()}</p>}
                    </div>
                  </div>

                  {!showTokenInput ? (
                    <div className="flex gap-2">
                      <button onClick={() => setShowTokenInput(true)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Update Token
                      </button>
                      <button onClick={handleDeleteToken} disabled={isLoading} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                        {isLoading ? "Deleting..." : "Delete Token"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Enter new {providerInfo.title} {providerInfo.tokenName}:
                        </label>
                        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={`Paste your new ${providerInfo.tokenName} here...`} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors" disabled={isLoading} autoFocus />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This will replace your current token. The old token will be permanently removed.</p>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => { setShowTokenInput(false); setToken(""); }} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors" disabled={isLoading}>
                          Cancel
                        </button>
                        <button onClick={handleSaveToken} disabled={isLoading || !token.trim()} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {isLoading ? "Updating..." : "Update Token"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // No token saved - show setup instructions and token input
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Setup Instructions</h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">To use {providerInfo.title} integration, you need to create a {providerInfo.tokenName} first.</p>
                    <a href={providerInfo.tokenUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium">
                      Open {providerInfo.title} Token Settings
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>

                  {/* Token Input Section - Always Visible */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter your {providerInfo.title} {providerInfo.tokenName}:</label>
                      <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={`Paste your ${providerInfo.tokenName} here...`} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors" disabled={isLoading} />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This token will be stored directly in your users table (githubToken/vercelToken).</p>
                    </div>

                    <button onClick={handleSaveToken} disabled={isLoading || !token.trim()} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? "Saving Token..." : "Save Token"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
