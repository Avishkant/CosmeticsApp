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
      .then(async () => {
        // helper to convert image URL to dataURL via canvas (may fail due to CORS)
        const loadImageDataURL = (url) =>
          new Promise((resolve) => {
            if (!url) return resolve(null);
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = function () {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                  resolve(dataUrl);
                } catch (err) {
                  resolve(null);
                }
              };
              img.onerror = function () {
                resolve(null);
              };
              img.src = url;
              // if cached and already complete
              if (img.complete) {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                  resolve(dataUrl);
                } catch (err) {
                  resolve(null);
                }
              }
            } catch (e) {
              resolve(null);
            }
          });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Order Receipt - ${order._id}`, 14, 20);
        doc.setFontSize(11);
        doc.text(`Status: ${order.status}`, 14, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 36);

        // Payment summary
        let y = 46;
        if (order.payment) {
          doc.setFontSize(12);
          doc.text("Payment:", 14, y);
          doc.setFontSize(10);
          y += 6;
          const meta = order.payment.meta || {};
          const pid =
            meta.razorpayPaymentId ||
            meta.paymentId ||
            meta.id ||
            meta.transactionId ||
            "-";
          doc.text(`Method: ${order.payment.provider || "-"}`, 14, y);
          y += 6;
          doc.text(`Payment ID: ${pid}`, 14, y);
          y += 6;
          doc.text(`Amount: ₹${order.total.toFixed(2)}`, 14, y);
          y += 10;
        }

        // Shipping address
        if (order.shipping) {
          doc.setFontSize(12);
          doc.text("Shipping:", 14, y);
          doc.setFontSize(10);
          y += 6;
          const s = order.shipping;
          const addrLines = [];
          if (s.name) addrLines.push(s.name);
          if (s.address) addrLines.push(s.address);
          const cityLine = `${s.city || ""}${
            s.pincode ? ", " + s.pincode : ""
          }`.trim();
          if (cityLine) addrLines.push(cityLine);
          if (s.phone) addrLines.push(`Phone: ${s.phone}`);
          addrLines.forEach((ln) => {
            doc.text(ln, 14, y);
            y += 6;
          });
          y += 4;
        }

        doc.setFontSize(11);
        doc.text("Items:", 14, y);
        y += 6;

        for (const it of order.items) {
          const name =
            (it.productId && (it.productId.title || it.productId)) || "Product";
          const imgUrl =
            it.productId &&
            it.productId.images &&
            it.productId.images[0] &&
            it.productId.images[0].url;
          // try to load image dataURL (may fail due to CORS); proceed without image if not available
          const dataUrl = await loadImageDataURL(imgUrl);
          const textX = dataUrl ? 40 : 14;
          if (dataUrl) {
            try {
              // determine format
              const fmt = dataUrl.indexOf("image/png") > -1 ? "PNG" : "JPEG";
              doc.addImage(dataUrl, fmt, 14, y - 4, 22, 22);
            } catch (e) {
              // ignore image errors
            }
          }
          const line = `${name} x ${it.qty} — ₹${(it.price * it.qty).toFixed(
            2
          )}`;
          doc.text(line, textX, y + 6);
          y += 26;
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
        }

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
          lines
        .push(
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
    const w = window.open("", "_blank", "width=700,height=900");
    if (!w) return alert("Unable to open print window");
    const paymentMeta =
      order.payment && order.payment.meta ? order.payment.meta : {};
    const paymentId =
      paymentMeta.razorpayPaymentId ||
      paymentMeta.paymentId ||
      paymentMeta.id ||
      paymentMeta.transactionId ||
      "-";
    const shipping = order.shipping || {};
    const html = `
      <html>
        <head>
          <title>Receipt ${order._id}</title>
          <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px} img{max-width:60px;max-height:60px;object-fit:cover;border-radius:6px}</style>
        </head>
        <body>
          <h2>Order ${order._id}</h2>
          <div>Status: ${order.status}</div>
          <div>Payment: ${
            order.payment && order.payment.provider
          } — ${paymentId} — ₹${order.total.toFixed(2)}</div>
          <h3>Shipping</h3>
          <div>${shipping.name || ""}</div>
          <div>${shipping.address || ""}</div>
          <div>${shipping.city || ""} ${shipping.pincode || ""}</div>
          <h3>Items</h3>
          <ul>
            ${order.items
              .map((it) => {
                const prod =
                  it.productId && typeof it.productId === "object"
                    ? it.productId
                    : null;
                const title =
                  (prod && (prod.title || prod.name)) ||
                  (typeof it.productId === "string" ? it.productId : "Product");
                const img =
                  prod && prod.images && prod.images[0] && prod.images[0].url;
                return `<li style="display:flex;align-items:center;gap:12px;margin-bottom:10px">${
                  img ? `<img src="${img}"/>` : ""
                }<div><div style="font-weight:600">${title}</div><div>Qty: ${
                  it.qty
                } — ₹${(it.price * it.qty).toFixed(2)}</div></div></li>`;
              })
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
          {order.items.map((it) => {
            const prod =
              it.productId && typeof it.productId === "object"
                ? it.productId
                : null;
            const title =
              (prod && (prod.title || prod.name)) ||
              (typeof it.productId === "string" ? it.productId : "Product");
            const img =
              prod && prod.images && prod.images[0] && prod.images[0].url;
            return (
              <li
                key={it._id || (prod && prod._id) || title}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={img || "/vite.svg"}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-gray-600">Qty: {it.qty}</div>
                  </div>
                </div>
                <div className="font-semibold">
                  ₹{(it.price * it.qty).toFixed(2)}
                </div>
              </li>
            );
          })}
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
          Method: {order.payment && order.payment.provider}
        </div>
        <div className="mt-1">
          Status: {order.payment && order.payment.status}
        </div>
        {order.payment && order.payment.meta && (
          <div className="mt-2 text-sm text-gray-700">
            <div>
              {(() => {
                const meta = order.payment.meta || {};
                // common keys used by razorpay integration
                const pid =
                  meta.razorpayPaymentId ||
                  meta.paymentId ||
                  meta.id ||
                  meta.transactionId;
                return <div>Payment ID: {pid || "-"}</div>;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Shipping / address */}
      {order.shipping && (
        <div className="mt-4 border p-4 rounded">
          <h3 className="font-medium">Shipping Address</h3>
          <div className="mt-2">
            <div className="font-medium">
              {order.shipping.name || order.shipping.label || "Recipient"}
            </div>
            <div className="text-sm text-gray-700">
              {order.shipping.address}
            </div>
            <div className="text-sm text-gray-700">
              {order.shipping.city}, {order.shipping.state}{" "}
              {order.shipping.pincode}
            </div>
            {order.shipping.phone && (
              <div className="text-sm text-gray-700">
                Phone: {order.shipping.phone}
              </div>
            )}
            {order.shipping.method && (
              <div className="text-sm text-gray-700">
                Shipping method: {order.shipping.method} (
                {order.shipping.cost ? `₹${order.shipping.cost}` : "Free"})
              </div>
            )}
          </div>
        </div>
      )}

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
