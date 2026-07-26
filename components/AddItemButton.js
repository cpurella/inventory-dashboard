"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import Modal from "@/components/Modal";
import NewItemClient from "@/components/NewItemClient";

export default function AddItemButton({ categories }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm bg-teal-500 text-black font-medium px-3 py-1.5 rounded-md hover:bg-teal-400"
      >
        <PlusCircle className="w-4 h-4" /> Add New Item
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <NewItemClient categories={categories} />
      </Modal>
    </>
  );
}
