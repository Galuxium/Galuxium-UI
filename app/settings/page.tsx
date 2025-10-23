"use client";

import React, { useEffect, useState } from "react";
import {
  FaCrown,
  FaUserEdit,
  FaBookOpen,
  FaBug,
  FaDiscord,
  FaTimes,
  FaLinkedin,
  FaMailBulk,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Image from "next/image";
import Dropzone from "react-dropzone";
import emailjs from "@emailjs/browser";
/* -----------------------
   Types
----------------------- */
type ModalStep = "none" | "edit";

type ProfileForm = {
  name: string;
  avatar_url: string | null;
  github_url: string;
  devpost_url: string;
  linkedin_url: string;
  email: string;
  username: string;
  plan: string;
  tokens_used: number;
};

/* -----------------------
   Main Page
----------------------- */
export default function SettingsPage() {
  const [modalStep, setModalStep] = useState<ModalStep>("none");
  const [bugModalOpen, setBugModalOpen] = useState(false);
// Bug report form state
  const [bugForm, setBugForm] = useState({
    name: "",
    email: "",
    issue: "",
    description: "",
  });const handleBugChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBugForm({ ...bugForm, [e.target.name]: e.target.value });
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bugForm.issue || !bugForm.description) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      await emailjs.send(
        "service_tb0au5m", // Replace with your EmailJS service ID
        "template_28huqr8", // Replace with your EmailJS template ID
        {
          from_name: bugForm.name,
          from_email: bugForm.email,
          issue_title: bugForm.issue,
          issue_description: bugForm.description,
          submitted_on: new Date().toLocaleString()
        },
        "4lAbyTg2CSF5mpWVq" // Replace with your EmailJS public key
      );
      toast.success("Bug report sent successfully!");
      setBugForm({ name: "", email: "", issue: "", description: "" });
      setBugModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send bug report. Try again later.");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 px-10 py-7 text-[#1A1A1A]">
      {/* Heading */}
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold pb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
          Your personal control center
        </h1>
        <p className="text-lg text-gray-500 mt-3 font-normal">
          Manage your subscription, preferences, and profile here.
        </p>
      </header>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <SettingsCard
          icon={<FaCrown size={28} className="text-yellow-500" />}
          title="Subscription Plan"
          description="Manage billing, invoices, or upgrade anytime."
          buttonLabel="Manage Plan"
          onClick={() => (window.location.href = "/subscriptions")}
        />
        <SettingsCard
          icon={<FaUserEdit size={28} className="text-blue-500" />}
          title="Profile Settings"
          description="Update your profile, avatar, bio and social links."
          buttonLabel="Edit Profile"
          onClick={() => setModalStep("edit")}
        />
        <SettingsCard
          icon={<FaBookOpen size={28} className="text-lime-500" />}
          title="Help Docs"
          description="Read guides, walkthroughs, and API docs."
          buttonLabel="Visit Docs"
          onClick={() => (window.location.href = "/docs")}
        />
        <SettingsCard
          icon={<FaBug size={28} className="text-teal-600" />}
          title="Report a Bug"
          description="Found something broken? Let us know."
          buttonLabel="Report Issue"
          onClick={() => setBugModalOpen(true)}
        />
        <SettingsCard
          icon={<FaDiscord size={28} className="text-indigo-600" />}
          title="Join Discord"
          description="Connect with the community & get live help."
          buttonLabel="Join Now"
          onClick={() => window.open("https://discord.gg/rxYxPexa", "_blank")}
        />
        <SettingsCard
          icon={<FaLinkedin size={28} className="text-indigo-600" />}
          title="Follow us on LinkedIn"
          description="Stay updated with the latest news & updates."
          buttonLabel="Follow"
          onClick={() => window.open("https://www.linkedin.com/company/galuxium/", "_blank")}
        />
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {modalStep === "edit" && (
          <EditProfileModal onClose={() => setModalStep("none")} />
        )}
      </AnimatePresence>

        {/* Report Bug Modal */}
      <AnimatePresence>
        {bugModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBugModalOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg relative">
                <button
                  onClick={() => setBugModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black"
                >
                  <FaTimes />
                </button>

                <h2 className="text-2xl font-bold mb-4 ml-2 text-[#2000c1] flex items-center gap-2">
                  <FaBug /> Report a Bug
                </h2>
                <p className="text-gray-600 mb-4 ml-2">
                  Found something broken? Let us know!
                </p>

                <form onSubmit={handleBugSubmit} className="space-y-4">
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={bugForm.name}
                    onChange={handleBugChange}
                  />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={bugForm.email}
                    onChange={handleBugChange}
                  />
                  <Input
                    type="text"
                    name="issue"
                    placeholder="Issue Title"
                    value={bugForm.issue}
                    onChange={handleBugChange}
                    required
                  />
                  <textarea
                    name="description"
                    placeholder="Describe the issue..."
                    rows={4}
                    value={bugForm.description}
                    onChange={handleBugChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2000c1]"
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-lg shadow hover:brightness-110"
                  >
                    <FaMailBulk /> Send Report
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------
   Profile Modal
----------------------- */
const EditProfileModal = ({ onClose }: { onClose: () => void }) => {
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    avatar_url: "",
    devpost_url: "",
    github_url: "",
    linkedin_url: "",
    email: "",
    username: "",
    plan: "free",
    tokens_used: 0,
  });

  // Prefill profile
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from("users")
          .select(
            "name, avatar_url,username, devpost_url, github_url, linkedin_url, email,plan,tokens_used"
          )
          .eq("id", session.user.id)
          .single();
        if (error || !data) {
          setProfileForm((p) => ({
            ...p,
            email: session.user.email ?? "",
            username: session.user.user_metadata?.username ?? "",
          }));
          return;
        }

        setProfileForm((prev) => ({
  ...prev,
  ...data,
}));

      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();
  },[]);
const handleDeleteAvatar = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return toast.error("Not logged in");

  // Remove avatar URL in the user table
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", session.user.id);

  if (error) {
    console.error("Failed to delete avatar:", error);
    toast.error("Failed to delete avatar");
    return;
  }

  setProfileForm((p) => ({ ...p, avatar_url: null }));
  toast.success("Avatar deleted!");
};

const handleAvatarUpload = async (files: File[]) => {
  if (!files[0]) return;
  const file = files[0];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return toast.error("Not logged in");

  const filePath = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-_]/g, "_")}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { cacheControl: "3600", upsert: true });

  if (error) {
    console.error("Avatar upload failed:", error);
    toast.error(`Avatar upload failed: ${error.message}`);
    return;
  }

  const { data: publicUrl } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);



  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("id", session.user.id);

  if (updateError) {
    console.error("Failed to update user profile:", updateError);
    toast.error("Failed to update profile");
    return;
  }

  setProfileForm((p) => ({ ...p, avatar_url: publicUrl.publicUrl }));
  toast.success("Avatar updated!");
};




const normalize = (val: string | null | undefined) => {
  return val && val.trim() !== "" ? val : null;
};

const handleSaveProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return toast.error("Not logged in");

  const username = normalize(profileForm.username);

  // ✅ Step 1: If username provided, check uniqueness
  if (username) {
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", session.user.id) // ignore current user
      .maybeSingle();

    if (checkError) {
      console.error("Check error:", checkError);
      toast.error("Error checking username availability.");
      return;
    }

    if (existing) {
      toast.error("Username already taken.");
      return;
    }
  }

  // ✅ Step 2: Proceed with upsert
  const payload = {
    id: session.user.id,
    name: normalize(profileForm.name),
    email: session.user.email, // always required
    avatar_url: normalize(profileForm.avatar_url),
    devpost_url: normalize(profileForm.devpost_url),
    github_url: normalize(profileForm.github_url),
    linkedin_url: normalize(profileForm.linkedin_url),
    username,
  };

  const { error } = await supabase.from("users").upsert(payload);

  if (error) {
    console.error("Supabase error:", error);
    toast.error("Failed to update profile.");
    return;
  }

  toast.success("Profile saved");
  onClose();
};



  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
      >
        <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-black"
          >
            <FaTimes />
          </button>

          <h2 className="text-2xl font-bold mb-7 ml-3 text-[#2000c1]">
            Edit Profile
          </h2>

          <div className="flex gap-6">
            {/* Avatar */}
            <div className="w-1/3 flex flex-col items-center">
              <Dropzone
                accept={{ "image/*": [] }}
                multiple={false}
                onDrop={handleAvatarUpload}
              >
                {({ getRootProps, getInputProps }) => (
                  <div
                    {...getRootProps()}
                    className="relative w-28 h-28 rounded-full border-4 border-[#2000c1] overflow-hidden shadow cursor-pointer"
                  >
                    <input {...getInputProps()} />
                    <Image
                    key={profileForm.avatar_url}
                      src={profileForm.avatar_url || "/default-avatar.jpg"}
                      alt="avatar"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-sm">
                      Change
                    </div>
                  </div>
                )}
              </Dropzone>
              <p className="text-sm text-gray-500 mt-2">
                Drag & drop or click to upload
              </p>
                {profileForm.avatar_url && (
    <button
      onClick={handleDeleteAvatar}
      className="mt-2 px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
    >
      Delete Avatar
    </button>
  )}
            </div>

            {/* Fields */}
            <div className="w-2/3 space-y-3">
            
              <Input
                placeholder="Full Name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={profileForm.email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <Input
                placeholder="Username"
                value={`@${profileForm.username}`}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
         
              <div className="grid grid-cols-1 gap-3">
                <Input
                  placeholder="LinkedIn URL"
                  value={profileForm.linkedin_url ?? ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      linkedin_url: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Devpost URL"
                  value={profileForm.devpost_url ?? ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      devpost_url: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="GitHub URL"
                  value={profileForm.github_url ?? ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      github_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-lg shadow hover:brightness-110"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

/* -----------------------
   SettingsCard
----------------------- */
const SettingsCard = ({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E7EB] flex flex-col justify-between"
  >
    <div className="flex items-center gap-4">
      {icon}
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-[#4B5563] py-5">{description}</p>
    <div
      onClick={onClick}
      role="button"
      className="inline-block w-fit px-4 py-2 rounded-lg bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white text-sm font-semibold shadow-md hover:brightness-110 transition-all cursor-pointer"
    >
      {buttonLabel}
    </div>
  </motion.div>
);
