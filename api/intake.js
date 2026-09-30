import { Resend } from "resend";

const TO = process.env.INTAKE_TO || "alexis@gotit2work.com";
const FROM = process.env.INTAKE_FROM || "Nobleman Productions <noreply@gotit2work.com>";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const row = (label, value) =>
  value ? `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;font-size:15px;color:#0a0a0a">${esc(value)}</td></tr>` : "";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "Email is not configured yet." });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (b.company_website) return res.status(200).json({ ok: true });

  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "That email address looks wrong." });
  if (name.length > 200 || email.length > 200) return res.status(400).json({ error: "Those values are too long." });

  const details = String(b.details || "").trim().slice(0, 5000);
  const resend = new Resend(process.env.RESEND_API_KEY);

  const table = [
    row("Name", name),
    row("Email", email),
    row("Phone", b.phone),
    row("Company", b.company),
    row("Service", b.service),
    row("Budget", b.budget),
    row("Dates", b.dates),
    row("City / venue", b.venue),
  ].join("");

  const notify = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px">
<p style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6b7280;margin:0 0 8px">New inquiry</p>
<h1 style="font-size:24px;font-weight:500;margin:0 0 24px;color:#0a0a0a">${esc(name)}${b.company ? " &middot; " + esc(b.company) : ""}</h1>
<table style="border-collapse:collapse;margin-bottom:24px">${table}</table>
${details ? `<p style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6b7280;margin:0 0 8px">Details</p><div style="font-size:15px;line-height:1.6;color:#0a0a0a;white-space:pre-wrap">${esc(details)}</div>` : ""}
<p style="margin:32px 0 0;font-size:13px;color:#6b7280">Reply directly to this email to reach ${esc(name)}.</p>
</div>`;

  const confirm = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px">
<h1 style="font-size:24px;font-weight:500;margin:0 0 16px;color:#0a0a0a">We've got it.</h1>
<p style="font-size:16px;line-height:1.6;color:#0a0a0a;margin:0 0 16px">Thanks for reaching out${name ? ", " + esc(name.split(" ")[0]) : ""}. Your inquiry is in front of Jean and Justin, and one of them will reply personally the same business day.</p>
<p style="font-size:16px;line-height:1.6;color:#0a0a0a;margin:0 0 24px">In the meantime, recent work is at <a href="https://vimeo.com/noblemanproductions" style="color:#031e25">vimeo.com/noblemanproductions</a>.</p>
<p style="margin:0;font-size:14px;color:#6b7280">Nobleman Productions &middot; San Diego</p>
</div>`;

  try {
    const sent = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject: `Inquiry — ${name}${b.company ? " (" + b.company + ")" : ""}`,
      html: notify,
    });
    if (sent.error) throw new Error(sent.error.message || "Resend rejected the notification");

    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "We received your inquiry — Nobleman Productions",
      html: confirm,
    }).catch(() => {});

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("intake failed", err);
    return res.status(502).json({ error: "We could not send that. Please email alexis@gotit2work.com directly." });
  }
}
