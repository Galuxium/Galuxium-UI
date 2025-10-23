"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaTrash } from "react-icons/fa";
import Image from "next/image";
import { useSession } from "@/lib/SessionContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";

interface Store {
  id: string;
  product_title: string;
  product_desc: string;
  product_url: string;
  product_price: number;
  created_at: string;
}

export default function StorePage() {
  const [modal, setModal] = useState<"none" | "create" | "manage" | "detail">("none");
  const [selected, setSelected] = useState<Store | null>(null);
  const [products, setProducts] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("store")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch products");
        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, [session, router]);

  const openDetail = (p: Store) => {
    setSelected(p);
    setModal("detail");
  };

  if (loading) return <Loading />;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 px-10 py-7 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex justify-between mb-7">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent pb-2 bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
          Store
          <p className="text-lg font-normal text-gray-500 mt-3">
            Browse your favourite product with ease.
          </p>
        </h1>
      </div>

      {/* Product Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E7EB] overflow-hidden flex flex-col h-full">
              <div className="cursor-pointer" onClick={() => openDetail(p)}>
                <Image
                  src={p.product_url}
                  alt={p.product_title}
                  width={300}
                  height={200}
                  className="h-40 w-80 object-cover rounded-xl mb-4"
                />
                <h2 className="text-lg font-semibold mb-2">{p.product_title}</h2>
                <p className="text-gray-600 flex-grow mb-4 text-sm">{p.product_desc}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-700">
                  ₹{p.product_price}
                </span>
                <button className="inline-block w-fit px-3 py-1 rounded-lg bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white text-md font-semibold shadow-md hover:scale-95 transition-all cursor-pointer">
                  Buy
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal !== "none" && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/20 backdrop-blur-sm"
              onClick={() => setModal("none")}
            />
            <motion.div
              key="modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center p-4"
            >
              

              {/* MANAGE */}
              {modal === "manage" && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E7EB] w-full max-w-2xl relative">
                  <button
                    onClick={() => setModal("none")}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                  >
                    <FaTimes />
                  </button>
                  <h2 className="text-2xl font-bold mb-6">Manage Products</h2>
                  <div className="space-y-4">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 bg-white rounded-3xl p-4 shadow"
                      >
                        <Image
                          src={p.product_url}
                          alt={p.product_title}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{p.product_title}</h3>
                          <p className="text-gray-500">₹{p.product_price}</p>
                        </div>
                        <button
                          onClick={() => openDetail(p)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAIL */}
              {modal === "detail" && selected && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E7EB] w-full max-w-lg relative">
                  <button
                    onClick={() => setModal("none")}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                  >
                    <FaTimes />
                  </button>
                  <h2 className="text-2xl font-bold mb-4">{selected.product_title}</h2>
                  <Image
                    src={selected.product_url}
                    width={300}
                    height={200}
                    alt={selected.product_title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <p className="text-gray-700 mb-4">{selected.product_desc}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-indigo-700">
                      ₹{selected.product_price}
                    </span>
                    
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
