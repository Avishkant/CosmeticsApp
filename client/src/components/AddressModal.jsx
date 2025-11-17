import React, { useState, useEffect } from "react";
import { useToast } from "./ToastProvider";

export default function AddressModal({ address, onSave, onCancel }) {
  const [form, setForm] = useState(address || {});
  const { showToast } = useToast();

  useEffect(() => setForm(address || {}), [address]);

  const validate = () => {
    if (!form.name || String(form.name).trim().length < 2) {
      showToast("Please enter a valid name", "error");
      return false;
    }
    if (!form.phone || String(form.phone).trim().length < 6) {
      showToast("Please enter a valid phone number", "error");
      return false;
    }
    if (!form.addressLine1 || String(form.addressLine1).trim().length < 4) {
      showToast("Please enter a valid address", "error");
      return false;
    }
    if (!form.city || String(form.city).trim().length < 2) {
      showToast("Please enter a city", "error");
      return false;
    }
    if (!form.pincode || String(form.pincode).trim().length < 3) {
      showToast("Please enter a valid pincode", "error");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await onSave(form);
      showToast("Address saved", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to save address", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={onCancel}
      />
      <div className="bg-white rounded shadow-lg p-6 z-10 w-full max-w-lg">
        <h3 className="font-semibold mb-3">
          {form && form._id ? "Edit Address" : "Add Address"}
        </h3>
        <div className="space-y-2">
          <label className="block">Label</label>
          <input
            className="border p-2 w-full"
            value={form.label || ""}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <label className="block">Name</label>
          <input
            className="border p-2 w-full"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <label className="block">Phone</label>
          <input
            className="border p-2 w-full"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <label className="block">Address line 1</label>
          <input
            className="border p-2 w-full"
            value={form.addressLine1 || ""}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block">City</label>
              <input
                className="border p-2 w-full"
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="w-32">
              <label className="block">Pincode</label>
              <input
                className="border p-2 w-full"
                value={form.pincode || ""}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
