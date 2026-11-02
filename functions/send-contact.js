// Cloudflare Pages Function: receives the Contact form and emails it through Resend.
// Requires the RESEND_API_KEY secret (set in Cloudflare Pages → Settings → Variables and Secrets).

const TO_ADDRESS = "steven@ropeswingstudios.ai";
const FROM_ADDRESS = "The Harvest Run <forms@notify.theharvestrun.com>";
const MAX_MESSAGE_LENGTH = 5000;
const SENT_REDIRECT = "/contact?sent=1";

export async function onRequestPost({ request, env }) {
  const form = await request.formData();

  // Honeypot: real visitors leave this field empty, bots tend to fill it in.
  if (String(form.get("website") || "").trim() !== "") {
    return Response.redirect(new URL(SENT_REDIRECT, request.url), 303);
  }

  const email = String(form.get("email") || "").trim();
  const firstName = String(form.get("first_name") || "").trim();
  const lastName = String(form.get("last_name") || "").trim();
  const message = String(form.get("message") || "").trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!email || !firstName || !lastName) {
    return new Response("Please fill in your email address and name.", { status: 400 });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      reply_to: email,
      subject: `The Harvest Run contact form: ${firstName} ${lastName}`,
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\n${message || "(no message)"}`,
    }),
  });

  if (!resendResponse.ok) {
    return new Response("Sorry, your message could not be sent. Please try again later.", { status: 502 });
  }

  return Response.redirect(new URL(SENT_REDIRECT, request.url), 303);
}
