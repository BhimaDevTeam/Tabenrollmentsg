import { SG_OTP_SEND_API } from "../apiurl";

const OTP_STORE_KEY = "sgOtpSession";

// Generate a random 6-digit OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Send an SMS OTP to a Singapore mobile number and remember it for validation.
// Returns true on success, false when the SMS API could not be reached / rejected.
export const sendSgOtp = async (mobileNo) => {
  const otp = generateOtp();
  const body = JSON.stringify({
    verificationType: "SMS",
    mobileNo: String(mobileNo),
    isdCode: "+65",
    country: "INTL",
    locale: "en-SG",
    smsText: `Your OTP is ${otp} from Bhima Jewellers. This OTP is valid for next 3 minutes only`,
  });
  const options = { method: "POST", headers: { "Content-Type": "application/json" }, body };

  let ok = false;
  try {
    const res = await fetch(SG_OTP_SEND_API, options);
    ok = res.ok;
  } catch (err) {
    console.warn("SG OTP direct send failed, trying proxy:", err);
    try {
      const res = await fetch("/api/sgotp/send", options);
      ok = res.ok;
    } catch (proxyErr) {
      console.warn("SG OTP proxy send failed:", proxyErr);
    }
  }

  if (ok) {
    sessionStorage.setItem(
      OTP_STORE_KEY,
      JSON.stringify({ mobileNo: String(mobileNo), otp, expiresAt: Date.now() + 3 * 60 * 1000 })
    );
  }
  return ok;
};

// Validate entered OTP. Returns "" when valid, otherwise an error message.
export const verifySgOtp = (mobileNo, enteredOtp) => {
  let session = null;
  try {
    session = JSON.parse(sessionStorage.getItem(OTP_STORE_KEY) || "null");
  } catch {
    session = null;
  }
  if (!session || session.mobileNo !== String(mobileNo)) return "OTP not sent. Please resend OTP.";
  if (Date.now() > session.expiresAt) return "OTP expired. Please resend OTP.";
  if (String(enteredOtp).trim() !== session.otp) return "Invalid OTP. Please try again.";
  sessionStorage.removeItem(OTP_STORE_KEY);
  return "";
};
