import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrder } from "../lib/api";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchOrder(id)
      .then((r) => {
        if (mounted) {
          setOrder(r.data);
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!order) return <div className="p-6">Order not found</div>;
  const downloadReceipt = () => {
    // generate a simple styled PDF using jsPDF loaded from CDN
    const loadJsPDF = () =>
      new Promise((resolve, reject) => {
        if (window.jspdf) return resolve(window.jspdf);
        const s = document.createElement("script");
        s.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = () => resolve(window.jspdf);
        s.onerror = () => reject(new Error("Failed to load jsPDF"));
        document.body.appendChild(s);
      });

    loadJsPDF()
      .then(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Order Receipt - ${order._id}`, 14, 20);
        doc.setFontSize(11);
        doc.text(`Status: ${order.status}`, 14, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 36);
        let y = 48;
        doc.text("Items:", 14, y);
        y += 6;
        order.items.forEach((it) => {
          const name =
            (it.productId && (it.productId.title || it.productId)) || "Product";
          const line = `${name} x ${it.qty} — ₹${(it.price * it.qty).toFixed(
            2
          )}`;
          doc.text(line, 14, y);
          y += 6;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
        y += 6;
        doc.text(`Subtotal: ₹${order.subtotal.toFixed(2)}`, 14, y);
        y += 6;
        if (order.discounts && order.discounts.length) {
          doc.text(
            `Discounts: -₹${order.discounts
              .reduce((s, d) => s + d.amount, 0)
              .toFixed(2)}`,
            14,
            y
          );
          y += 6;
        }
        doc.text(`Total: ₹${order.total.toFixed(2)}`, 14, y);
        doc.save(`receipt_${order._id}.pdf`);
      })
      .catch((e) => {
        console.error("jsPDF load failed", e);
        alert("Failed to generate PDF, falling back to text download");
        const lines = [];
        lines.push(`Order: ${order._id}`);
        lines.push(`Status: ${order.status}`);
        lines.push("");
        lines.push("Items:");
        order.items.forEach((it) => {
          const name =
            (it.productId && (it.productId.title || it.productId)) || "Product";
          lines.push(
            `${name} x ${it.qty} — ₹${(it.price * it.qty).toFixed(2)}`
          );
        });
        lines.push("");
        lines.push(`Subtotal: ₹${order.subtotal.toFixed(2)}`);
        if (order.discounts && order.discounts.length)
          lines.push(
            `Discounts: -₹${order.discounts
              .reduce((s, d) => s + d.amount, 0)
              .toFixed(2)}`
          );
        lines.push(`Total: ₹${order.total.toFixed(2)}`);
        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt_${order._id}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
  };

  const printReceipt = () => {
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return alert("Unable to open print window");
    const html = `
      <html>
        <head>
          <title>Receipt ${order._id}</title>
          <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}</style>
        </head>
        <body>
          <h2>Order ${order._id}</h2>
          <div>Status: ${order.status}</div>
          <h3>Items</h3>
          <ul>
            ${order.items
              .map(
                (it) =>
                  `<li>${
                    (it.productId && (it.productId.title || it.productId)) ||
                    "Product"
                  } x ${it.qty} — ₹${(it.price * it.qty).toFixed(2)}</li>`
              )
              .join("")}
          </ul>
          <div>Subtotal: ₹${order.subtotal.toFixed(2)}</div>
          <div>Total: ₹${order.total.toFixed(2)}</div>
        </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Order {order._id}</h2>
      <div className="mb-4">
        Status: <span className="font-semibold">{order.status}</span>
      </div>
      <div className="border p-4 rounded">
        <h3 className="font-medium">Items</h3>
        <ul className="mt-2 space-y-2">
          {order.items.map((it) => (
            <li
              key={it._id || (it.productId && it.productId._id)}
              className="flex justify-between"
            >
              <div>
                {(it.productId && (it.productId.title || it.productId)) ||
                  "Product"}{" "}
                x {it.qty}
              </div>
              <div>₹{(it.price * it.qty).toFixed(2)}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between">
          <div>Subtotal</div>
          <div>₹{order.subtotal.toFixed(2)}</div>
        </div>
        {order.discounts && order.discounts.length > 0 && (
          <div className="mt-2 flex justify-between text-green-600">
            <div>Discounts</div>
            <div>
              -₹{order.discounts.reduce((s, d) => s + d.amount, 0).toFixed(2)}
            </div>
          </div>
        )}
        <div className="mt-2 flex justify-between font-semibold">
          <div>Total</div>
          <div>₹{order.total.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-4 border p-4 rounded">
        <h3 className="font-medium">Payment</h3>
        <div className="mt-2">
          Provider: {order.payment && order.payment.provider}
        </div>
        <div className="mt-1">
          Status: {order.payment && order.payment.status}
        </div>
        {order.payment && order.payment.meta && (
          <div className="mt-2 text-sm text-gray-700">
            <div>Meta:</div>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(order.payment.meta, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={downloadReceipt}
            className="bg-gray-200 px-3 py-2 rounded"
          >
            Download receipt
          </button>
          <button
            onClick={printReceipt}
            className="bg-gray-200 px-3 py-2 rounded"
          >
            Print receipt
          </button>
          <Link to="/" className="text-sm text-indigo-600">
            Back to products
          </Link>
        </div>
      </div>
    </div>
  );
}
