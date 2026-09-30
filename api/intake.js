import { Resend } from "resend";

const TO = process.env.INTAKE_TO || "alexis@gotit2work.com";
const FROM = process.env.INTAKE_FROM || "Nobleman Productions <noreply@gotit2work.com>";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Single-line text: no control characters (keeps subjects and headers clean), capped length.
const line = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

const row = (label, value) =>
  value ? `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;font-size:15px;color:#0a0a0a">${esc(value)}</td></tr>` : "";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  // Until Resend is connected, tell the visitor how to reach us instead of showing a configuration error.
  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: "Online inquiries aren't switched on yet. Please email alexis@gotit2work.com, and we'll usually reply the same business day." });
  }

  let raw;
  try {
    raw = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "We couldn't read that request. Please try again, or email alexis@gotit2work.com." });
  }
  if (raw.company_website) return res.status(200).json({ ok: true });

  const name = String(raw.name || "").trim();
  const email = String(raw.email || "").trim();
  if (!name || !email) return res.status(400).json({ error: "Please fill in your name and email." });
  if (name.length > 200 || email.length > 200) return res.status(400).json({ error: "Your name or email is too long. Please shorten it and try again." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "That email address doesn't look right. Please check it and try again." });

  const b = {
    phone: line(raw.phone, 50), company: line(raw.company), service: line(raw.service, 100),
    budget: line(raw.budget, 50), dates: line(raw.dates), venue: line(raw.venue),
  };
  const safeName = line(name);
  const details = String(raw.details || "").trim().slice(0, 5000);
  // The confirmation goes to whatever address was typed in, so it must not carry free text a spammer
  // could use to relay a message through our domain. Greet by first name only when it looks like a name.
  const firstName = safeName.split(" ")[0];
  const greetName = /^[\p{L}'’-]{1,30}$/u.test(firstName) ? firstName : "";
  const resend = new Resend(process.env.RESEND_API_KEY);

  const table = [
    row("Name", safeName),
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
<h1 style="font-size:24px;font-weight:500;margin:0 0 24px;color:#0a0a0a">${esc(safeName)}${b.company ? " &middot; " + esc(b.company) : ""}</h1>
<table style="border-collapse:collapse;margin-bottom:24px">${table}</table>
${details ? `<p style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6b7280;margin:0 0 8px">Details</p><div style="font-size:15px;line-height:1.6;color:#0a0a0a;white-space:pre-wrap">${esc(details)}</div>` : ""}
<p style="margin:32px 0 0;font-size:13px;color:#6b7280">Reply directly to this email to reach ${esc(safeName)}.</p>
</div>`;

  const confirm = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px">
<h1 style="font-size:24px;font-weight:500;margin:0 0 16px;color:#0a0a0a">We've got it.</h1>
<p style="font-size:16px;line-height:1.6;color:#0a0a0a;margin:0 0 16px">Thanks for reaching out${greetName ? ", " + esc(greetName) : ""}. Your inquiry is in front of Jean and Justin, and one of them will reply personally, usually the same business day.</p>
<p style="font-size:16px;line-height:1.6;color:#0a0a0a;margin:0 0 24px">In the meantime, recent work is at <a href="https://vimeo.com/noblemanproductions" style="color:#031e25">vimeo.com/noblemanproductions</a>.</p>
<p style="margin:0;font-size:14px;color:#6b7280">Nobleman Productions &middot; San Diego</p>
</div>`;

  try {
    const sent = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject: `Inquiry — ${safeName}${b.company ? " (" + b.company + ")" : ""}`,
      html: notify,
    });
    if (sent.error) throw new Error(sent.error.message || "Resend rejected the notification");

    // The inquiry itself has been delivered; the visitor's confirmation is best effort, but the page must not
    // claim it was sent if it wasn't.
    const conf = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "We received your inquiry — Nobleman Productions",
      html: confirm,
    }).catch((e) => ({ error: e }));

    return res.status(200).json({ ok: true, confirmationSent: !(conf && conf.error) });
  } catch (err) {
    console.error("intake failed", err);
    return res.status(502).json({ error: "We could not send that. Please email alexis@gotit2work.com directly." });
  }
}
