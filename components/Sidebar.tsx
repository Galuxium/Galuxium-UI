"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTimes, FaBars, FaTachometerAlt, FaCogs, FaGamepad } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBolt,
  FaSignOutAlt,
  FaWindowMaximize,
} from "react-icons/fa";
import { useSession } from "@/lib/SessionContext";
import { Session } from "@supabase/supabase-js";
import { SettingsIcon } from "lucide-react";
import GlobalSettings from "./GlobalSettings";
interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.jpg");
  const [mobileOpen, setMobileOpen] = useState(false);
const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  // Fetch user avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();
      setAvatarUrl(data?.avatar_url || "/default-avatar.jpg");
    };
    fetchAvatar();
  }, [session?.user?.id]);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: "/" },
    { label: "MVPs", icon: <FaCogs />, path: "/mvps" },
    { label: "Galuxium AI", icon: <FaBolt />, path: "/galuxiumai" },
    { label: "Settings", icon: <FaGamepad />, path: "/settings" },
  ];


  const handleSelect = (path: string) => {
    if (pathname !== path) router.push(path);
    setMobileOpen(false); // Close drawer on mobile
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    setLoading(false);
  };

  /** Desktop Sidebar */
  const DesktopSidebar = (
    <div
      className={`hidden md:flex flex-col justify-between h-full fixed top-0 left-0 border-r border-gray-200 shadow-md bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[5vw]" : "w-[16vw]"
      }`}
    >
      {/* Top Section */}
      <div className={`${collapsed ? "px-1 relative" : "px-6 py-5 relative"}`}>
        <h1
          className={`text-4xl pb-4 font-extrabold text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#2000c1] to-[#2e147e] brightness-125 transition-all duration-300 ${
            collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100 mt-5"
          }`}
        >
          Galuxium
        </h1>

        <div className={`transition-all duration-500 ${collapsed ? "flex justify-center" : ""}`}>
          <Image
            src="/glogo.png"
            alt="Logo"
            width={collapsed ? 80 : 0}
            height={collapsed ? 80 : 0}
            className={`${collapsed ? "" : "opacity-0"} rounded-3xl`}
          />
        </div>

        <button
          onClick={toggleCollapsed}
          className={`absolute ${
            collapsed ? "top-20 left-5" : "top-2 right-2"
          } p-1.5 rounded-2xl text-gray-600 hover:text-[#2e147e] transition`}
          aria-label="Toggle Sidebar"
        >
          <FaWindowMaximize size={20} />
        </button>

        {/* Menu */}
        <nav className={`flex flex-col gap-2 ${collapsed ? "mt-14" : "mt-5"}`}>
          {menuItems.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={pathname === item.path}
              onSelect={handleSelect}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>
          <div className="ml-3.5">
                      <button onClick={() => { setShowGlobalSettings(true); }} className="px-3 py-2  dark:bg-black border rounded"><SettingsIcon/></button>
          </div>
      {/* Bottom Section */}
      <SidebarBottom
        collapsed={collapsed}
        avatarUrl={avatarUrl}
        session={session}
        loading={loading}
        handleSignOut={handleSignOut}
        setModalOpen={setModalOpen}
      />
      
    </div>
    
  );

  /** Mobile Sidebar Drawer */
  const MobileSidebar = (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
          
          {/* Drawer */}
          <motion.aside
            className="fixed top-0 left-0 h-full w-64 bg-violet-200 shadow-lg z-10 flex flex-col justify-between"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-5 relative">
              <div className={`transition-all duration-500 flex justify-center`}>
          <Image
            src="/glogo.png"
            alt="Logo"
            width={150}
            height={150}
            className={`rounded-3xl`}
          />
        </div>
              <nav className="flex flex-col gap-2 ">
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    isActive={pathname === item.path}
                    onSelect={handleSelect}
                    collapsed={false}
                  />
                ))}
              </nav>
            </div>

            <SidebarBottom
              collapsed={false}
              avatarUrl={avatarUrl}
              session={session}
              loading={loading}
              handleSignOut={handleSignOut}
              setModalOpen={setModalOpen}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <FaBars size={20} />
      </button>

      {DesktopSidebar}
      {MobileSidebar}
      <AnimatePresence>{modalOpen && <ProfileModal onClose={() => setModalOpen(false)} />}</AnimatePresence>
      <GlobalSettings
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
        initialTab="services"
        
      />
    </>
  );
}

/** Menu Item */
type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onSelect: (path: string) => void;
  collapsed: boolean;
};

function MenuItem({ icon, label, path, isActive, onSelect, collapsed }: MenuItemProps) {
  return (
    <div
      onClick={() => onSelect(path)}
      className={`flex items-center ${
        collapsed ? "justify-center" : "gap-4"
      } px-5 py-2 mx-2 my-1 rounded-lg cursor-pointer transition-all duration-200 select-none ${
        isActive
          ? "bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white shadow-md"
          : "hover:bg-gray-100 text-gray-700"
      }`}
      role="button"
      aria-current={isActive ? "page" : undefined}
    >
      <span className={`text-lg ${isActive ? "text-white" : "text-gray-500"}`}>{icon}</span>
      {!collapsed && <span className="text-1xl font-medium">{label}</span>}
    </div>
  );
}

/** Sidebar Bottom */
function SidebarBottom({
  collapsed,
  avatarUrl,
  session,
  loading,
  handleSignOut,
  setModalOpen,
}: {
  collapsed: boolean;
  avatarUrl: string;
  session: Session|null;
  loading: boolean;
  handleSignOut: () => void;
  setModalOpen: (value: boolean) => void;
}) {

  
  return (
    <div
      className={`${
        collapsed
          ? ""
          : "bg-gradient-to-r from-[#2000c1] to-[#2e147e] m-5 h-[17vh] rounded-2xl flex justify-end p-4 flex-col relative"
      }`}
    >
      <div
        onClick={() => setModalOpen(true)}
        className={`absolute transition-all duration-300 ${
          collapsed ? "left-5 bottom-22" : "left-9 bottom-18"
        }`}
      >
        <Image
          src={avatarUrl}
          alt="avatar"
          width={collapsed ? 40 : 65}
          height={collapsed ? 40 : 65}
          className={`rounded-3xl border-[#2000c1] object-cover ${
            collapsed ? "border-3" : "border-4"
          }`}
        />
      </div>
  
      {!collapsed && (
        <>
          <p className="font-bold text-white text-1xl">
            {session?.user?.user_metadata.first_name ||
              session?.user?.user_metadata?.name}
          </p>
          <p className="font-medium text-gray-300 text-xs">{session?.user?.email}</p>
        </>
      )}

      <button
        onClick={handleSignOut}
        className={`bg-white p-2.5 rounded-2xl flex absolute hover:text-red-600 hover:scale-95 duration-500 transition-all ${
          collapsed
            ? "right-3.5 bottom-[2vw] border-2 shadow-md border-gray-400"
            : "right-4 top-[2.5vw] md:top-[2vh]"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-y-3 border-l-3 border-red-600"></div>
          </div>
        ) : (
          <FaSignOutAlt className="size-5" />
        )}
      </button>
    </div>
  );
}

/** Profile Modal */
type ProfileForm = {
  name: string;
  avatar_url: string | null;
  email: string;
  username: string;
  plan: string;
  tokens_used: number;
};

const ProfileModal = ({ onClose }: { onClose: () => void }) => {
  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    avatar_url: "",
    email: "",
    username: "",
    plan: "free",
    tokens_used: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data } = await supabase
          .from("users")
          .select(
            "name, avatar_url,username, email,plan,tokens_used,assistantTokens,userTokens"
          )
          .eq("id", session.user.id)
          .single();

        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative border border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
          >
            <FaTimes size={20} />
          </button>

          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-gradient-to-r from-[#2000c1] to-[#2e147e] shadow-xl mb-4">
              <Image
                src={profile.avatar_url || "/default-avatar.jpg"}
                alt="avatar"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-[#2000c1]">{profile.name}</h2>
            <p className="text-gray-600 text-lg">@{profile.username}</p>
            <p className="text-gray-400 text-sm">{profile.email}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-[#2000c1]/10 to-[#2e147e]/10 rounded-2xl p-6 flex flex-col items-center shadow-md">
              <p className="text-gray-500 uppercase text-sm mb-1">Plan</p>
              <h3 className="text-xl font-semibold text-[#2e147e]">{profile.plan}</h3>
            </div>

            <div className="bg-gradient-to-r from-[#2e147e]/10 to-[#2000c1]/10 rounded-2xl p-6 flex flex-col items-center shadow-md">
              <p className="text-gray-500 uppercase text-sm mb-1">Tokens Used</p>
              <h3 className="text-xl font-semibold text-[#2e147e]">{profile.tokens_used}</h3>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
                  style={{ width: `${Math.min(profile.tokens_used, 100)}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
};
