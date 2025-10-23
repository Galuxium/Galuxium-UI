"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
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

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(data);
        setAvatarUrl(data.avatar_url || "/default-avatar.jpg");
      }
    };

    getUser();
  }, []);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `avatars/${user.id}-${file.name}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex justify-center items-center">
      <div className="bg-[#111827] p-10 rounded-3xl shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Profile</h2>

        <div className="flex justify-center mb-4">
          <Image
            src={
              avatarUrl ||
              `https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.email}`
            }
            width={100}
            height={100}
            className="rounded-full"
            alt="Avatar"
          />
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          className="block w-full text-sm text-gray-400 mb-4"
        />

        {uploading && (
          <p className="text-center text-sm text-blue-400">Uploading...</p>
        )}
      </div>
    </div>
  );
}
