"use client";
export function Progress({ value = 0 }) {
  return (
    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 transition-all"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}
