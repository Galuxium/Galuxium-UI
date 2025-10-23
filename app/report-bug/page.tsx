"use client";

import React, { useState } from "react";
import { FiX, FiMail } from "react-icons/fi";

/**
 * Report Bug Page
 *
 * - Opens modal on page load
 * - Form with Name, Email, Issue Title, Description
 * - Sends email to cofounder.galuxium@gmail.com using EmailJS
 * - TailwindCSS styling
 */

export default function ReportBugPage() {
  const [modalOpen, setModalOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Using mailto as a quick solution
      const mailtoLink = `mailto:cofounder.galuxium@gmail.com?subject=${encodeURIComponent(
        form.title
      )}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nIssue:\n${form.description}`)}`;

      window.location.href = mailtoLink;

      setSuccess(true);
      setForm({ name: "", email: "", title: "", description: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to open email client. Please try manually.");
    } finally {
      setSending(false);
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-lg">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
            >
              <FiX size={20} />
            </button>

            <h2 className="text-2xl font-bold text-[#2000c1] mb-2">Report a Bug</h2>
            <p className="text-gray-600 mb-4">Found something broken? Let us know!</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2000c1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2000c1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2000c1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2000c1]"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-lg shadow hover:opacity-90 disabled:opacity-50"
              >
                <FiMail /> {sending ? "Sending..." : "Report Issue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {!modalOpen && success && (
        <div className="p-6 bg-white rounded-2xl shadow-lg text-center">
          <h3 className="text-xl font-bold text-[#2000c1] mb-2">Thank you!</h3>
          <p className="text-gray-600">Your issue has been prepared for email. Please send it via your email client.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 bg-[#2000c1] text-white rounded-lg"
          >
            Report another issue
          </button>
        </div>
      )}
    </div>
  );
}
