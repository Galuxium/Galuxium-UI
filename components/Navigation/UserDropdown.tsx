"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

export default function UserDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const avatarUrl =
    user?.user_metadata?.avatar_url && user?.user_metadata?.avatar_url !== ""
      ? user.user_metadata.avatar_url
      : "/default-avatar.jpg";

  const loadUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUser({
        ...session.user,
        ...data,
      });
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="justify-end p-3 flex z-50 relative">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
      >
        <p className="font-semibold text-gray-800 text-lg">
          {user?.first_name || user?.user_metadata?.name}
        </p>
        <Image
          src={avatarUrl}
          alt="avatar"
          width={45}
          height={45}
          className="rounded-full border-2 border-gray-200"
        />
      </button>

      {dropdownOpen && (
        <div className="absolute top-20 right-4 mt-2 w-64 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden z-50">
          <div className="px-4 py-6 flex flex-col items-center text-center">
            <Image
              src={avatarUrl}
              alt="profile"
              width={64}
              height={64}
              className="rounded-full mb-2 border border-gray-300"
            />
            <p className="text-lg text-gray-900 font-bold mt-1">
              {user?.first_name || user?.user_metadata?.name}
            </p>
            <p className="text-gray-500 font-medium text-sm">{user?.email}</p>
          </div>

          <div className="border-t border-gray-200" />

          <button
            onClick={() => router.push("/profile")}
            className="flex font-semibold items-center justify-center w-full px-4 py-3 hover:bg-gray-100 transition duration-300 text-gray-800 text-sm gap-2"
          >
            <FaUserCircle className="size-5 text-gray-600" />
            Profile Settings
          </button>

          <button
            onClick={handleSignOut}
            className="flex text-red-600 font-semibold items-center hover:bg-red-50 justify-center w-full px-4 py-3 border-t border-gray-200 transition duration-300 gap-2"
          >
            <FaSignOutAlt className="size-5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
