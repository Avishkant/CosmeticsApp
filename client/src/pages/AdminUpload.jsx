import React, { useState } from "react";
import { uploadProductsCSV } from "../lib/api";

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Select a CSV file");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadProductsCSV(fd);
      setResult(res.data);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Admin CSV Upload</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files && e.target.files[0])}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Upload
        </button>
      </form>
      {result && (
        <pre className="mt-4 bg-gray-100 p-4 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
