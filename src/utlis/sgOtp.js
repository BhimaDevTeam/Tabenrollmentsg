import { SG_OTP_SEND_API, SG_OTP_VALIDATE_API } from "../apiurl";

const basePayload = (mobileNo) => ({
  verificationType: "SMS",
  mobileNo: String(mobileNo),
  isdCode: "+65",
  country: "INTL",
  locale: "en-SG",
});

// POST JSON to the OTP API; falls back to the same-origin proxy if the direct call is blocked (CORS).
const postOtp = async (url, proxyPath, payload) => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
  const parse = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };
  try {
    return await parse(await fetch(url, options));
  } catch (err) {
    console.warn("SG OTP direct call failed, trying proxy:", err);
    try {
      return await parse(await fetch(proxyPath, options));
    } catch (proxyErr) {
      console.warn("SG OTP proxy call failed:", proxyErr);
      return null;
    }
  }
};

// Ask the server to send an SMS OTP. Returns true on success.
export const sendSgOtp = async (mobileNo) => {
  const data = await postOtp(SG_OTP_SEND_API, "/api/sgotp/send", basePayload(mobileNo));
  return Boolean(data && data.success);
};

// Validate the OTP on the server. Returns "" when valid, otherwise an error message.
export const verifySgOtp = async (mobileNo, enteredOtp) => {
  const data = await postOtp(SG_OTP_VALIDATE_API, "/api/sgotp/validate", {
    ...basePayload(mobileNo),
    otp: String(enteredOtp).trim(),
  });
  if (!data) return "Failed to verify OTP. Please try again.";
  if (data.success) return "";
  return data.message || data.error?.message || "Invalid or expired OTP";
};
