import React, { useState, useEffect, useRef } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import { BaseURL, Drafttabledb, getCollectionApiUrl } from "../../apiurl";
import "./Mypage.css";
import { Button, Card, Grid } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowRight, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { CreditCard, Smartphone, ChevronRight, Check } from "lucide-react";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../utlis/currencyUtils";

const SCHEME_TERMS_MAP = {
  KUBERA: {
    title: "BHIMA KUBERA SCHEME - TERMS & CONDITIONS",
    clauses: [
      "1. Enrollment & Installments: Subscribers shall pay 11 equal monthly installments. Installments must be paid on or before the due date each month.",
      "2. Duration & Maturity: Scheme maturity is 330 days (11 months) from the date of initial enrollment.",
      "3. Scheme Benefit: Upon successful completion of 11 installments, the customer is entitled to 100% discount on Value Addition (making charges) up to specified limits, or 1 month bonus installment benefit as applicable.",
      "4. Redemption: Redemption is permitted solely against Gold Jewelry/Ornaments at authorized Bhima Gold outlets. Cash refunds or cash redemptions are strictly prohibited under any circumstances.",
      "5. Default/Non-Payment: In case of skipped or delayed installments, the bonus benefit / making charge discount will be recalculated or prorated based on actual installment count.",
      "6. Pre-closure: Pre-closure prior to completion of 6 months will disqualify the account from receiving any scheme discount or bonus benefits.",
      "7. Identity Verification: Valid government photo ID proof (Aadhaar / PAN) and KYC verification are mandatory for scheme enrollment and redemption.",
      "8. Taxes & Duties: All applicable statutory taxes including GST, TCS, or government levies at the time of final billing/redemption shall be borne by the customer.",
      "9. Transferability: Scheme account is strictly non-transferable. Only the registered subscriber or designated nominee can redeem upon producing identity proof.",
      "10. Jurisdiction: All disputes are subject to the exclusive jurisdiction of local courts where the branch of enrollment is situated."
    ]
  },
  SAMRUDDHI: {
    title: "BHIMA SAMRUDDHI SCHEME - TERMS & CONDITIONS",
    clauses: [
      "1. Gold Rate Booking & Accumulation: Monthly installments paid are converted into equivalent gold weight (in grams) based on the board rate prevailing on the date of payment.",
      "2. Duration: The scheme spans 11 monthly installments over 330 days.",
      "3. Maturity Benefit: On maturity after 11 complete installments, accumulated gold weight can be redeemed as gold jewelry with 0% making charges up to the accumulated limit.",
      "4. Installment Timelines: Monthly installments must be paid consistently every 30 days. Missed payments will lock rate at default date.",
      "5. No Cash Refunds: Scheme balance cannot be refunded in cash under any circumstances as per statutory rules.",
      "6. Pre-closure Policy: Pre-closure before 6 months will convert accumulated funds to standard purchase value without zero making charge benefits.",
      "7. Taxes: GST and other applicable government taxes at billing time are extra.",
      "8. KYC Compliance: eKYC and Aadhaar/PAN documentation are compulsory.",
      "9. Nominee Clause: In event of demise of subscriber, designated nominee can redeem accumulated gold weight upon valid death certificate & ID proof."
    ]
  },
  RATNA: {
    title: "BHIMA RATNA SCHEME - TERMS & CONDITIONS",
    clauses: [
      "1. Scope: Dedicated savings plan for Diamond, Uncut Diamond, and Precious Gemstone Jewelry purchases.",
      "2. Tenure: 11 equal monthly installments.",
      "3. Special Benefits: 100% waiver on making charges and special diamond value addition discounts upon completing 11 installments.",
      "4. Non-Refundable: Cash refund is strictly disallowed under Indian government guidelines.",
      "5. Redemption: Redemption available exclusively against Diamond and Gemstone studded ornaments at Bhima Gold showrooms.",
      "6. Statutory Taxes: GST as applicable on redemption date must be paid by the customer.",
      "7. Non-transferable: Scheme cannot be assigned or transferred to third parties."
    ]
  },
  "KANAKA PLUS": {
    title: "TERMS & CONDITIONS – KANAKA PLUS ADVANCE PLAN",
    clauses: [
      "1. Duration of the plan: The advance plan duration is 11 months from the date of enrolment.",
      "2. Eligibility & Enrolment: Members can enrol in the plan by making a One-Time Advance (OTA) payment with a minimum of S$ 5,000 (Five Thousand Singapore Dollars). Upon completion of 11 months, members may redeem the OTA and purchase Gold, Diamond, Silver, or Platinum jewellery.",
      "• The advance amount is non-transferable and can be utilized only against the purchase of: 22 KT Gold Coins, Silver articles & Coins, Gold Jewellery, Diamond Jewellery, Platinum Jewellery.",
      "• The (OTA) advance amount will be converted into 22KT Gold weight or Silver weight at the prevailing market rate on the date of payment received confirmation at our end, and the corresponding weight will be credited to the customer’s account.",
      "• No interest is applicable for the (OTA) advance payments under any circumstances.",
      "3. Identification & Membership Card: Valid identification documents must be submitted at time of plan enrolment. A nominee must be appointed and mentioned in the plan application. Address changes or loss of membership card must be reported immediately with updated Identification at our Singapore branch.",
      "4. Payment Modes & Limitations: The advance amount must be paid only through the following modes: Pay Now, Pay Lah, Debit Card, Credit Card, NETS. Cash payments are strictly not permitted • Submission of a valid NRIC card copy is mandatory.",
      "5. At the Time of Purchase: During the plan redemption purchase, members must be present in our showroom with their Membership Card and valid ID proof. GST and all applicable Government levies must be paid at the time of purchase/delivery. Members may purchase any of the following, based on their total advance value: 22KT Gold Ornaments, 22KT Gold Coins, Silver Coins, Silver Articles, Exclusive Diamond Jewellery, Platinum Jewellery or any combination of the above.",
      "6. Advance plan Closure Benefits – Gold & Silver: Benefits are determined by the completion period and duration. For instance, if the plan concludes between 184–213 days (6 months), the member is entitled to 50% of the total VA for the total accumulated weight.",
      "7. Advance plan Closure Benefits – Diamond & Platinum: Benefits for Diamond and Platinum jewellery shall be calculated based on the total OTA paid divided into equivalent units of 11 months. (If the enrolment (OTA) advance amount is S$ 5,000: S$5,000/11x2).",
      "• Important Notes: Diamond carat or Platinum weight is not credited. Only the value of the advance amount is considered for benefit calculation. Benefits are calculated based on the total OTA paid divided into equivalent units of 11 months. Full benefit of the plan will be credited only upon completion of 334 days or more.",
      "• Early Closure – Benefit Applicability: In case of early closure, benefits for Diamond & Platinum jewellery will be calculated based on the month-wise slab structure applicable under the advance plan.",
      "  - A) Closure within 2 months (1–62 days): No benefits applicable • Only the advance amount paid will be adjusted against the jewellery purchase • All making charges and applicable costs must be paid in full.",
      "  - B) Closure at completion of 8 months (244–273 days) Gold / Silver Jewellery: 70% benefit applicable • 30% of the making charges must be paid by the customer (Example: Total making charges = S$ 1200, Benefit = S$ 840, Customer payable = S$360). Diamond / Platinum Jewellery: Benefit = Advance amount x (2/11) • At completion of 8 months, 70% of the 2-month benefit is applicable (Example: Total Advance = S$5,000, Full 2-month Benefit = S$5,000/11x2, Applicable Benefit at 8 months (70%) = S$ 636.36).",
      "8. General Conditions:",
      "• Thrilok Gold and Diamonds Pte Limited reserves the right to amend, modify, or take final decisions regarding this plan.",
      "• This advance plan cannot be combined with any other promotional offer or gold rate promotion.",
      "• New collections are excluded for 3 months from launch • This advance plan is subject to the jurisdiction of Singapore.",
      "• Members must comply with all applicable Government rules, regulations, and statutory requirements.",
      "• This advance plan can be redeemed at Thrilok Gold and Diamonds Pte Limited Singapore showroom.",
      "9. Buying Gold or Silver: Your advance is converted into the actual weight of gold or silver. You also enjoy 0% making charges on jewellery.",
      "10. Buying Diamond or Platinum: When you choose Diamond or Platinum jewellery, you get additional value equivalent to 2 units of your total advance amount."
    ]
  },
  KANAKA_PLUS: {
    title: "TERMS & CONDITIONS – KANAKA PLUS ADVANCE PLAN",
    clauses: [
      "1. Duration of the plan: The advance plan duration is 11 months from the date of enrolment.",
      "2. Eligibility & Enrolment: Members can enrol in the plan by making a One-Time Advance (OTA) payment with a minimum of S$ 5,000 (Five Thousand Singapore Dollars). Upon completion of 11 months, members may redeem the OTA and purchase Gold, Diamond, Silver, or Platinum jewellery.",
      "• The advance amount is non-transferable and can be utilized only against the purchase of: 22 KT Gold Coins, Silver articles & Coins, Gold Jewellery, Diamond Jewellery, Platinum Jewellery.",
      "• The (OTA) advance amount will be converted into 22KT Gold weight or Silver weight at the prevailing market rate on the date of payment received confirmation at our end, and the corresponding weight will be credited to the customer’s account.",
      "• No interest is applicable for the (OTA) advance payments under any circumstances.",
      "3. Identification & Membership Card: Valid identification documents must be submitted at time of plan enrolment. A nominee must be appointed and mentioned in the plan application. Address changes or loss of membership card must be reported immediately with updated Identification at our Singapore branch.",
      "4. Payment Modes & Limitations: The advance amount must be paid only through the following modes: Pay Now, Pay Lah, Debit Card, Credit Card, NETS. Cash payments are strictly not permitted • Submission of a valid NRIC card copy is mandatory.",
      "5. At the Time of Purchase: During the plan redemption purchase, members must be present in our showroom with their Membership Card and valid ID proof. GST and all applicable Government levies must be paid at the time of purchase/delivery. Members may purchase any of the following, based on their total advance value: 22KT Gold Ornaments, 22KT Gold Coins, Silver Coins, Silver Articles, Exclusive Diamond Jewellery, Platinum Jewellery or any combination of the above.",
      "6. Advance plan Closure Benefits – Gold & Silver: Benefits are determined by the completion period and duration. For instance, if the plan concludes between 184–213 days (6 months), the member is entitled to 50% of the total VA for the total accumulated weight.",
      "7. Advance plan Closure Benefits – Diamond & Platinum: Benefits for Diamond and Platinum jewellery shall be calculated based on the total OTA paid divided into equivalent units of 11 months. (If the enrolment (OTA) advance amount is S$ 5,000: S$5,000/11x2).",
      "• Important Notes: Diamond carat or Platinum weight is not credited. Only the value of the advance amount is considered for benefit calculation. Benefits are calculated based on the total OTA paid divided into equivalent units of 11 months. Full benefit of the plan will be credited only upon completion of 334 days or more.",
      "• Early Closure – Benefit Applicability: In case of early closure, benefits for Diamond & Platinum jewellery will be calculated based on the month-wise slab structure applicable under the advance plan.",
      "  - A) Closure within 2 months (1–62 days): No benefits applicable • Only the advance amount paid will be adjusted against the jewellery purchase • All making charges and applicable costs must be paid in full.",
      "  - B) Closure at completion of 8 months (244–273 days) Gold / Silver Jewellery: 70% benefit applicable • 30% of the making charges must be paid by the customer (Example: Total making charges = S$ 1200, Benefit = S$ 840, Customer payable = S$360). Diamond / Platinum Jewellery: Benefit = Advance amount x (2/11) • At completion of 8 months, 70% of the 2-month benefit is applicable (Example: Total Advance = S$5,000, Full 2-month Benefit = S$5,000/11x2, Applicable Benefit at 8 months (70%) = S$ 636.36).",
      "8. General Conditions:",
      "• Thrilok Gold and Diamonds Pte Limited reserves the right to amend, modify, or take final decisions regarding this plan.",
      "• This advance plan cannot be combined with any other promotional offer or gold rate promotion.",
      "• New collections are excluded for 3 months from launch • This advance plan is subject to the jurisdiction of Singapore.",
      "• Members must comply with all applicable Government rules, regulations, and statutory requirements.",
      "• This advance plan can be redeemed at Thrilok Gold and Diamonds Pte Limited Singapore showroom.",
      "9. Buying Gold or Silver: Your advance is converted into the actual weight of gold or silver. You also enjoy 0% making charges on jewellery.",
      "10. Buying Diamond or Platinum: When you choose Diamond or Platinum jewellery, you get additional value equivalent to 2 units of your total advance amount."
    ]
  },
  SWARNADHARA: {
    title: "BHIMA SWARNADHARA SCHEME - TERMS & CONDITIONS",
    clauses: [
      "1. Weight Accumulation: Monthly payments credited towards gold weight accumulation at current market rate.",
      "2. Duration: 11 months tenure.",
      "3. Benefits: Special Value Addition (VA) discount on gold ornaments upon full tenure completion.",
      "4. Redemption: Strictly in gold jewelry only; no cash refund.",
      "5. Identity Verification: Aadhaar eKYC mandatory."
    ]
  },
  SHREYAS: {
    title: "TERMS & CONDITIONS – SHREYAS ADVANCE PLAN",
    clauses: [
      "1. Duration: The advance plan is operational for a duration of 11 months from the date of enrolment.",
      "2. Eligibility & Enrolment: Membership begins with an Easy Monthly Advance (EMA) starting from minimum of S$100. Members of this plan will have the flexibility to redeem the accumulated advance to purchase Gold (22KT coin & Jewellery), Silver coin & articles, Diamond, or Platinum Jewellery.",
      "3. Monthly Payments:",
      "• EMA must be equal and consecutive for all 11 months.",
      "• Payments cannot extend beyond the 11th month from the date of enrolment.",
      "• EMA is non-transferable and valid only against the purchase of Gold (22KT coin & Jewellery), Diamond, Platinum jewellery, Silver articles & Silver coins.",
      "• EMA is converted into 22KT Gold/Silver weight as per the market rate on the date of payment.",
      "• EMA cannot be transferred to another plan or person.",
      "• Payments will have to be made on or before the due date. However only one EMA payment is accepted in a calendar month.",
      "• No interest is applicable for the advance payments under any circumstances.",
      "4. Identification & Membership Card: Valid identification documents must be submitted at time of plan enrolment. A nominee must be appointed and mentioned in the plan application. Address changes or loss of membership card must be reported immediately with updated Identification at our Singapore branch.",
      "5. Payment Limitations: Monthly advances above S$ 1800 must be paid via Debit/Credit Card, PAY NOW, PAY LAH, NETS. Cash will not be permitted as per Govt. norms. Jewellery purchase cannot be made using multiple plan accounts if combined cash advances exceeding S$20,000.",
      "6. Purchase Conditions: During the plan redemption purchase, members must be present in our showroom with their Membership Card and valid ID proof. GST and other applicable government levies if any must be paid at the time of purchase. Eligible purchases include 22KT Gold Ornaments, 22KT Gold Coins, Silver Coins/Articles, Diamond Jewellery, Platinum Jewellery, or a combination thereof.",
      "7. Advance plan Closure Benefits – Gold & Silver: Benefits are determined by the completion period and duration. For instance, if the plan concludes between 184–213 days (6 months), the member is entitled to a 50% Benefit on making charges of up to 18% VA for the total accumulated weight.",
      "• Note: VA benefit percentage range applies only up to 18% of the total Value Addition. Any excess VA over and above 18% is payable by the customer.",
      "• If multiple products are being purchased, making charges will be calculated according to each individual product independently.",
      "• The weight & value of the complementary coins will be forfeited if the customer fails to complete all 11 months.",
      "8. Advance plan Closure Benefits – Diamond & Platinum: Members may purchase Diamond/Platinum jewellery with the benefit of two months equivalent EMA (ranging 334+ days of completion). Early closure benefits will apply as per day-wise slabs proportionately. Example: At the completion of 8th month ranging between (244–273 days), if it is a S$ 200 enrolment the same shall yield S$ 280 as benefit. Up to the 3rd month ranging between (1–93 days), no benefits shall apply; only the advance paid amount will be credited if redeemed.",
      "9. General Conditions:",
      "• Thrilok Gold and Diamonds Pte Limited reserves all rights and final decisions.",
      "• This advance plan cannot be combined with other offers or gold rate promotions.",
      "• New collections are excluded for three months from launch.",
      "• The advance plan falls under the jurisdiction of Singapore.",
      "• This advance plan can be redeemed at Thrilok Gold and Diamonds Pte Limited Singapore showroom.",
      "• Members must comply with all applicable government regulations."
    ]
  }
};

const DEFAULT_SCHEME_TERMS = {
  title: "BHIMA GOLD MY VRUDHI SCHEME - TERMS & CONDITIONS",
  clauses: [
    "1. Enrollment & Tenure: Subscribers shall pay 11 equal monthly installments. Scheme duration is 330 days from enrollment.",
    "2. Scheme Privileges: Completing 11 monthly payments qualifies the customer for scheme benefits, including making charge discounts and bonus privileges.",
    "3. Payment Schedule: Installments must be paid every month on or before the due date.",
    "4. Non-Refundable in Cash: Under Government of India and RBI regulations, installment amounts cannot be refunded in cash under any circumstances.",
    "5. Redemption: Redemption is permitted solely against Gold, Diamond, or Silver Ornaments at authorized Bhima Gold outlets.",
    "6. eKYC & Identity Proof: Aadhaar eKYC and PAN verification are mandatory for scheme approval and final redemption.",
    "7. Statutory Taxes: Applicable taxes including GST and government levies at billing time shall be borne by the customer.",
    "8. Non-Transferability: Scheme membership is non-transferable and restricted to the registered subscriber or verified nominee.",
    "9. Pre-closure: Early termination before 6 months disqualifies the account from special scheme bonus benefits.",
    "10. Jurisdiction: All transactions are subject to local judicial jurisdiction of the issuing branch."
  ]
};

const getSchemeTerms = (schemeName) => {
  if (!schemeName) return DEFAULT_SCHEME_TERMS;
  const s = String(schemeName).toUpperCase();
  if (s.includes("KANAKA") || s.includes("BSK") || s.includes("KAP") || s.includes("OTA")) {
    return SCHEME_TERMS_MAP["KANAKA PLUS"];
  }
  if (s.includes("SHREYAS") || s.includes("BSR")) {
    return SCHEME_TERMS_MAP["SHREYAS"];
  }
  for (const [key, termsObj] of Object.entries(SCHEME_TERMS_MAP)) {
    if (s.includes(key) || key.includes(s)) {
      return termsObj;
    }
  }
  return DEFAULT_SCHEME_TERMS;
};

function Paymentgateway({
  setExpanded,
  savedraft,
  handlepayment,
  openModal,
  paymentMethodMode,
  handleModalOenOffline,
  onLinkGenerationStatus,
  hasEkycSignature,
  ekycSignature,
  setEkycSignature,
  generateEnrollmentPdfProp,
  onRequestPreview,
}) {
  const { currencySymbol, selectedCountry } = useSelector((state) => state.customer || {});
  const activeSymbol = currencySymbol || "₹";
  const isSingapore = selectedCountry === "Singapore";
  const isEsignEnabled = (localStorage.getItem("EnableEsign") || window.APP_CONFIG?.EnableEsign || "0") === "1";

  const [paymentLink, setPaymentLink] = useState(null);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("initial");
  const [successMessage, setSuccessMessage] = useState(null);
  const [PGlinkId, setPGlinkId] = useState(null);
  const [isAmountNull, setIsAmountNull] = useState(false);
  const [paymentcreation, setpaymentcreation] = useState(false);
  const [linkid, setlinkid] = useState(null);
  const pollingIntervalRef = useRef(null);
  const [ispaymentSaved, setIsPaymentSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDraftid, setuserDraftid] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isofflinedisable, setisofflinedisable] = useState(false);
  const [isoExpiryTime, setIsoExpiryTime] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [modeDisable, setmodeDisable] = useState("");
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasReadTermsModal, setHasReadTermsModal] = useState(false);
  const termsModalContainerRef = useRef(null);
  const [isSendingSignLink, setIsSendingSignLink] = useState(false);
  const [signLinkSent, setSignLinkSent] = useState(false);
  const [isCustomerSigned, setIsCustomerSigned] = useState(false);
  const [showSignPadModal, setShowSignPadModal] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [isSavingAfterSign, setIsSavingAfterSign] = useState(false);

  useEffect(() => {
    if (showTermsModal) {
      setHasReadTermsModal(false);
      setTimeout(() => {
        if (termsModalContainerRef.current) {
          const { scrollHeight, clientHeight } = termsModalContainerRef.current;
          if (scrollHeight <= clientHeight + 15) {
            setHasReadTermsModal(true);
          }
        }
      }, 100);
    }
  }, [showTermsModal]);
  // console.log("timeLeft,isoExpiryTime", isoExpiryTime, timeLeft);


  const navigate = useNavigate();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const md = localStorage.getItem("membershipData");
  const parsedData = md && md !== "undefined" ? JSON.parse(md) : {};
  const sd = localStorage.getItem("subscriberData");
  const sdparsedData = sd && sd !== "undefined" ? JSON.parse(sd) : {};

  const activeTerms = getSchemeTerms(parsedData?.selectedSchemeName);
  const bd = localStorage.getItem("bankData");
  const bdparsedData = bd && bd !== "undefined" ? JSON.parse(bd) : {};

  // Function to mask phone number
  const maskPhoneNumber = (phone) => {
    if (!phone) return "";
    return `****${phone.slice(-4)}`;
  };

  // Function to mask email
  const maskEmail = (email) => {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const maskedUser = user.slice(0, 5).replace(/./g, "*") + user.slice(5);
    return `${maskedUser}@${domain}`;
  };

  const CallSaveDraft = async (mode) => {
    const savestatus = savedraft(mode);
    return savestatus;
  };

  // const OpenModal = () => {
  //   openModal();                    ///////////////// Mohith_dev///////////
  // };

  async function callApi(link_id) {
    setlinkid(link_id);

    if (!link_id) {
      console.log("Link ID is missing");
      return false;
    }

    try {
      const response = await fetch(
        `${Drafttabledb}/user/FetchDetails/${link_id}`
      );
      const data = await response.json();

      if (data.details.link_status === "PAID") {
        const finalResponse = await fetch(
          `${Drafttabledb}/user/OrderDetails/${link_id}`
        );
        const finalData = await finalResponse.json();
        setSuccessMessage("Payment successful!");
        return "PAID";
      } else if (data.details.link_status === "ACTIVE") {
        const finalActiveResponse = await fetch(
          `${Drafttabledb}/user/OrderDetails/${link_id}`
        );
        const finalactiveData = await finalActiveResponse.json();

        if (finalactiveData.status === "EXPIRED") {
          console.error("Order status is EXPIRED.");
          return "EXPIRED";
        }

        const payments = finalactiveData.payments || [];
        const failedPayments = payments
          .filter((payment) => payment.payment_status === "FAILED")
          .map((payment) => ({
            payment_status: payment.payment_status,
            error_code: payment.error_details.error_code,
            error_description: payment.error_details.error_description,
            error_reason: payment.error_details.error_reason,
            order_id: payment.order_id,
            payment_group: payment.payment_group,
          }));

        if (failedPayments.length > 0) {
          // console.log("Failed Payments Details:", failedPayments);
          return failedPayments;
        } else {
          console.warn("No valid payments link found. Status remains ACTIVE.");
          return "ACTIVE";
        }
      } else {
        // console.log("Unexpected link status:", data.details.link_status);
        return data.details.link_status;
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
      return "ERROR";
    }
  }

  const generatePaymentLink = async () => {
    if (!isTermsChecked) {
      toast.error("Please accept the Terms and Conditions"); // ✅ show toast
      return;
    }
    // As of now: don't take signature on save/payment
    // if (!hasEkycSignature) {
    //   if (!signLinkSent) {
    //     toast.error("Please send for digital signature first!");
    //     return;
    //   }
    //   if (!isCustomerSigned) {
    //     toast.error("Please wait for the customer to sign the document!");
    //     return;
    //   }
    // }
    if (
      parsedData.installmentAmount === 0 ||
      parsedData.installmentAmount === ""
    ) {
      setIsAmountNull(true);
      setExpanded("membership-header");
      window.scrollTo(0, 0);
      return null;
    }
    setIsAmountNull(false);
    setShowConfirmModal(true);
  };

  const processPaymentAfterConfirmation = async () => {
    try {
      // Reuse draft created by "Send for Digital Signature" if already available
      let draftid = userDraftid;

      if (!draftid) {
        draftid = await CallSaveDraft("online");
        if (draftid) setuserDraftid(draftid);
      }

      if (draftid && draftid !== "") {
        setisofflinedisable(true);
        setShowPaymentOptions(true);

        // Disable offline when processing online payment
        setmodeDisable("offline");

        const paymentData = {
          DraftID: draftid,
          CustomerName: sdparsedData.subscriberName,
          CustomerMobileNo: sdparsedData.mobileNo,
          CustomerEmail: sdparsedData.email,
          BankAccountNo: bdparsedData.accountNo,
          IFSCCode: bdparsedData.ifscCode,
          link_purpose: parsedData.selectedSchemeName,
          InstAmt: parsedData.installmentAmount,
          return_url: `${window.location.origin}${window.location.pathname.startsWith('/vrudhitabenrollmentsg') ? '/vrudhitabenrollmentsg' : '/vrudhitabenrollment'}/success-page`,
        };

        setError(null);
        setPaymentStatus("processing");
        const now = new Date();
        const expiryTime = new Date(now.getTime() + 6 * 60 * 1000);
        const isoTime = expiryTime.toISOString();
        setIsoExpiryTime(isoTime);
        setTimeLeft(Math.floor((expiryTime - now) / 1000));

        const paymentResponse = await fetch(
          `${Drafttabledb}/user/create-payment-link`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData),
          }
        );

        const paymentResponseData = await paymentResponse.json();

        if (paymentResponse.ok && paymentResponseData.status === "ok") {
          const activeLinkId = paymentResponseData.PGlink_id;
          setPGlinkId(activeLinkId);
          setPaymentLink(paymentResponseData.link_url);
          onLinkGenerationStatus(true);
          setSuccessMessage(
            `Payment link has been sent to your mobile No ${maskPhoneNumber(
              paymentData.CustomerMobileNo
            )} and Email ${maskEmail(
              paymentData.CustomerEmail
            )}`
          );

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          const intervalId = setInterval(async () => {
            const result = await callApi(activeLinkId);
            if (result === "PAID") {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setPaymentStatus("PAID");
            }
          }, 5000);
          pollingIntervalRef.current = intervalId;
        } else {
          onLinkGenerationStatus(false);
          setError(
            paymentResponseData.details?.message || paymentResponseData.message || "An unexpected error occurred."
          );
          setSuccessMessage(null);
        }
      }
    } catch (error) {
      onLinkGenerationStatus(false);
      // console.error("Error:", error);
      setError(
        "An error occurred while generating the payment link. Please try again later."
      );
      setSuccessMessage(null);
    }
  };

  // Updated timer effect to re-enable offline when link expires
  useEffect(() => {
    if (!isoExpiryTime) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const expiryTime = new Date(isoExpiryTime);
      const difference = Math.max(Math.floor((expiryTime - now) / 1000), 0);
      setTimeLeft(difference);

      if (difference <= 0 && paymentStatus !== "PAID") {
        setPaymentStatus("initial");
        onLinkGenerationStatus(false);
        setSuccessMessage(null);
        // Re-enable offline option when link expires
        setmodeDisable("");
        // console.log("Payment link expired - offline option re-enabled");
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

  }, [isoExpiryTime, paymentStatus, onLinkGenerationStatus]);

  // Poll customer signature status when sign link is sent
  useEffect(() => {
    if (!signLinkSent || isCustomerSigned) return;

    const checkSignStatus = async () => {
      const mob = sdparsedData?.mobileNo;
      if (!mob) return;
      try {
        const cleanBranch = sdparsedData?.branch || localStorage.getItem("decodedBranch") || "";
        const isSingaporeCall = isSingapore || cleanBranch === "LN" || cleanBranch === "LI" || cleanBranch === "BGSG";
        const apiBase = getCollectionApiUrl(isSingaporeCall ? "Singapore" : selectedCountry);

        const resp = await fetch(`${apiBase}/enrollment-info?mobile=${mob}`, {
          headers: {
            "country-code": isSingaporeCall ? "singapore" : "india"
          }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.isSigned) {
            setIsCustomerSigned(true);
            if (data.signedFormUrl) setSignedPdfUrl(data.signedFormUrl);
            toast.success("✅ Customer signed document successfully!");
          }
        }
      } catch (err) {
        console.error("Error polling sign status:", err);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(checkSignStatus, 5000);
    // Also run immediately
    checkSignStatus();

    return () => clearInterval(interval);
  }, [paymentMethod, signLinkSent, isCustomerSigned, sdparsedData?.mobileNo]);

  useEffect(() => {
    if (paymentStatus === "PAID" && linkid) {
      navigate(`/success-page/${linkid}`);
    }
  }, [paymentStatus, linkid, navigate]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  const SaveOffline = async () => {
    paymentMethodMode("offline");

    // Call savedraft to update/create draft as offline on server
    const draftId = await CallSaveDraft("offline");
    if (draftId) {
      setuserDraftid(draftId);
    }
  };

  const handleSendForDigitalSignature = async () => {
    if (!isTermsChecked) {
      toast.error("Please accept the Terms and Conditions");
      return;
    }
    setIsSendingSignLink(true);
    try {
      // Only generate PDF + send sign link email — do NOT save draft yet
      let signReqId = null;
      if (typeof generateEnrollmentPdfProp === "function") {
        const cleanBranch = sdparsedData?.branch || localStorage.getItem("decodedBranch") || "";
        signReqId = await generateEnrollmentPdfProp(cleanBranch);
      } else {
        // Fallback: save draft which generates PDF + sends email
        const draftid = await CallSaveDraft(paymentMethod || "offline");
        if (draftid) setuserDraftid(draftid);
        signReqId = draftid;
      }
      if (signReqId) {
        setSignLinkSent(true);
        toast.success("✅ Digital sign link sent to customer's email!");
      } else {
        toast.error("Failed to generate sign link. Please try again.");
      }
    } catch (err) {
      toast.error("Error sending sign link.");
    } finally {
      setIsSendingSignLink(false);
    }
  };


  const sendPaymentmode = () => {
    paymentMethodMode(paymentMethod);
  };

  useEffect(() => {
    sendPaymentmode();
  }, [paymentMethod]);

  const handleConfirmPayment = async(confirmed) => {
    setShowConfirmModal(false);

    if (confirmed) {
      setmodeDisable("offline"); // Disable offline when processing online payment
      toast.success("Payment link will be send to your Mobile No. & Email.");
      await processPaymentAfterConfirmation();
      paymentMethodMode("online");
    } else {
      setPaymentStatus("initial");
    }
  };

  const activePaymentModeConfig = (localStorage.getItem("paymentMode") || window.APP_CONFIG?.PaymentMode || "Offline").toLowerCase();

  useEffect(() => {
    if (isSingapore || activePaymentModeConfig === "offline") {
      setPaymentMethod("offline");
    } else if (activePaymentModeConfig === "online") {
      setPaymentMethod("online");
    }
  }, [isSingapore, activePaymentModeConfig]);

  let paymentTypes = [];
  if (isSingapore || activePaymentModeConfig === "offline") {
    paymentTypes = [
      {
        id: "offline",
        label: "Offline",
        icon: <FaMoneyBillWave className="text-2xl" />,
      },
    ];
  } else if (activePaymentModeConfig === "online") {
    paymentTypes = [
      {
        id: "online",
        label: "Online",
        icon: <FaCreditCard className="text-2xl" />,
      },
    ];
  } else {
    paymentTypes = [
      {
        id: "online",
        label: "Online",
        icon: <FaCreditCard className="text-2xl" />,
      },
      {
        id: "offline",
        label: "Offline",
        icon: <FaMoneyBillWave className="text-2xl" />,
      },
    ];
  }



  //////////////// Cancel Payment Functionality ////////////////

  const cancelPayment = async () => {
    try {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      const result = await fetch(`${Drafttabledb}/user/Cancel/${PGlinkId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const response =  await result.json();

      if(response?.details?.link_status === "CANCELLED" ) {
        setPaymentStatus("initial");
        setPaymentLink(null);
        setmodeDisable("")
         toast.success("Payment cancelled successfully");
      }
    } catch (error) {
      console.error("Error cancelling payment:", error);
    }
  }

  if (isSingapore) {
    const totalPayable = (() => {
      const amt = Number(parsedData?.installmentAmount) || 0;
      if (amt <= 0) return 0;
      const gstRate = Number(parsedData?.gstValue) > 0 ? Number(parsedData?.gstValue) : 9;
      const isInclusive = parsedData?.isGSTInclusive === undefined || parsedData?.isGSTInclusive === null
        ? true
        : (Number(parsedData?.isGSTInclusive) === 1 || parsedData?.isGSTInclusive === true);

      if (isInclusive) {
        return amt;
      } else {
        return amt + (amt * gstRate) / 100;
      }
    })();

    return (
      <>
        <div className="pay-panel">
          {/* Terms Checkbox */}
          <div className="pay-terms-row">
            <input
              type="checkbox"
              id="termsCheckbox"
              checked={isTermsChecked}
              onChange={(e) => {
                if (e.target.checked) {
                  setShowTermsModal(true);
                } else {
                  setIsTermsChecked(false);
                }
              }}
            />
            <label htmlFor="termsCheckbox" className="pay-terms-label">
              I accept Bhima My Choice {parsedData?.selectedSchemeName || ""}{" "}
              <span
                className="pay-terms-link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsModal(true);
                }}
              >
                Terms and Conditions
              </span>
            </label>
          </div>

          {/* Total Payable Amount */}
          <div className="pay-amount-card">
            <span className="pay-amount-label">Total Payable Amount</span>
            <div className="pay-amount-value">
              {formatCurrency(totalPayable, activeSymbol)}
            </div>
          </div>

          {/* Signature and Saving — Singapore: sign pad opens automatically after T&C accept */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {isEsignEnabled && hasEkycSignature && ekycSignature && (
              <div className="pay-sig-box">
                <div className="pay-sig-head">
                  <div className="pay-sig-status">
                    <span aria-hidden="true">✅</span>
                    <span>Customer signature captured</span>
                  </div>
                  <button
                    type="button"
                    className="pay-btn-edit"
                    onClick={() => setShowSignPadModal(true)}
                  >
                    Edit Signature
                  </button>
                </div>
                <div className="pay-sig-preview">
                  <img
                    src={ekycSignature}
                    alt="Customer signature preview"
                  />
                </div>
              </div>
            )}

            {isEsignEnabled && !hasEkycSignature && isCustomerSigned && (
              <div className="pay-success-strip">
                <span aria-hidden="true">✅</span>
                <span>Customer signed successfully!</span>
              </div>
            )}

            {/* As of now: don't take signature on save */}
            {/* {isEsignEnabled && isTermsChecked && !hasEkycSignature && !isCustomerSigned && (
              <div className="pay-hint">
                Please complete your signature in the pad
              </div>
            )} */}

            <button
              type="button"
              className={`pay-btn-primary ${!isTermsChecked ? "is-disabled" : ""}`}
              onClick={() => {
                if (!isTermsChecked) {
                  toast.error("Please accept the Terms and Conditions");
                  return;
                }
                if (typeof onRequestPreview === "function") {
                  onRequestPreview("offline");
                } else {
                  SaveOffline();
                }
              }}
            >
              Save Offline
            </button>
            <button
              type="button"
              className="pay-btn-secondary"
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px 16px",
                background: "transparent",
                border: "1.5px solid #614119",
                color: "#614119",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
              onClick={() => {
                if (typeof onRequestPreview === "function") {
                  onRequestPreview("offline");
                }
              }}
            >
              <i className="bi bi-file-earmark-person"></i> Preview Enrollment
            </button>
          </div>
        </div>

        {showTermsModal && (
          <div
            className="pay-modal-overlay"
            onClick={() => setShowTermsModal(false)}
          >
            <div
              className="pay-modal-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pay-modal-head">
                <h3 className="pay-modal-title">{activeTerms.title}</h3>
                <button
                  type="button"
                  className="pay-modal-close"
                  onClick={() => setShowTermsModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div
                className="pay-modal-body"
                ref={termsModalContainerRef}
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.target;
                  if (scrollHeight - scrollTop - clientHeight <= 15) {
                    setHasReadTermsModal(true);
                  }
                }}
              >
                {activeTerms.clauses.map((clause, idx) => (
                  <p key={idx}>{clause}</p>
                ))}
              </div>

              <div className="pay-modal-foot">
                <div>
                  {!hasReadTermsModal && (
                    <span className="pay-modal-foot-hint warn">
                      Please scroll down to read the full terms.
                    </span>
                  )}
                  {hasReadTermsModal && (
                    <span className="pay-modal-foot-hint ok">
                      ✓ Thank you for reading.
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="pay-modal-accept"
                  disabled={!hasReadTermsModal}
                  onClick={() => {
                    setIsTermsChecked(true);
                    setShowTermsModal(false);
                    // Singapore: open signature pad immediately after T&C acceptance
                    // As of now: don't take signature:
                    // if (!hasEkycSignature && !isCustomerSigned) {
                    //   setShowSignPadModal(true);
                    // }
                  }}
                >
                  I Accept & Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showSignPadModal && (
          <SignaturePadModal
            open={showSignPadModal}
            onClose={() => setShowSignPadModal(false)}
            onSave={(signatureDataUrl) => {
              setEkycSignature(signatureDataUrl);
              setShowSignPadModal(false);
              toast.success("✅ Signature captured successfully!");
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="pay-panel">
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: "600",
            marginBottom: "0.25rem",
            color: "black",
          }}
        >
          Select Payment Method
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            marginTop: "15px",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="checkbox"
            id="termsCheckbox"
            checked={isTermsChecked}
            onChange={(e) => {
              if (e.target.checked) {
                setShowTermsModal(true);
              } else {
                setIsTermsChecked(false);
              }
            }}
            style={{ marginTop: "2px", accentColor: "rgb(140, 92, 52)" }}
          />
          <label
            htmlFor="termsCheckbox"
            style={{
              marginLeft: "8px",
              fontSize: "14px",
              color: "black",
              lineHeight: "1.4",
              maxWidth: "calc(100% - 30px)",
            }}
          >
            I accept Bhima My Choice {parsedData?.selectedSchemeName || ""}{" "}
            <span
              onClick={(e) => {
                e.preventDefault();
                setShowTermsModal(true);
              }}
              style={{
                color: "rgb(140, 92, 52)",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Terms and Conditions
            </span>
          </label>
        </div>
        {/* ✅ Online / Offline buttons — render only when multiple payment options exist */}
        {paymentTypes.length > 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "15px",
              justifyContent: "flex-start",
            }}
          >
            {paymentTypes.map((type) => (
              <Button
                key={type.id}
                onClick={() => {
                  if (!isTermsChecked) {
                    toast.error("Please read and accept the Terms and Conditions first");
                    return;
                  }
                  setPaymentMethod(type.id);
                }}
                aria-pressed={paymentMethod === type.id}
                disabled={
                  !isTermsChecked ||
                  (type.id === "offline" && (modeDisable === "offline" || paymentStatus === "PAID")) ||
                  (type.id === "online" && paymentStatus === "PAID")
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor:
                    (!isTermsChecked ||
                      (type.id === "offline" && (modeDisable === "offline" || paymentStatus === "PAID")) ||
                      (type.id === "online" && paymentStatus === "PAID"))
                      ? "not-allowed"
                      : "pointer",
                  background:
                    paymentMethod === type.id ? "rgb(140,92,52)" : "white",
                  color: paymentMethod === type.id ? "white" : "black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow:
                    paymentMethod !== type.id
                      ? "0 2px 5px rgba(0,0,0,0.1)"
                      : "none",
                  opacity:
                    (!isTermsChecked ||
                      (type.id === "offline" && (modeDisable === "offline" || paymentStatus === "PAID")) ||
                      (type.id === "online" && paymentStatus === "PAID"))
                      ? 0.5
                      : 1,
                }}
              >
                {type.icon}
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Show status message when offline is disabled */}
        {modeDisable === "offline" && paymentStatus === "processing" && (
          <p
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            Offline payment will be available after link expires
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                marginBottom: "15px",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "black",
              }}
            >
              Confirmation
            </h3>

            <i
              className="bi bi-exclamation-circle"
              style={{
                color: "#3B82F6",
                fontSize: "3rem",
                marginBottom: "15px",
                display: "block",
              }}
            ></i>

            <p style={{ marginBottom: "20px", fontSize: "1.1rem" }}>
              Do you wish to proceed with the payment of {formatCurrency(parsedData?.installmentAmount || 0, activeSymbol)}?
            </p>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => handleConfirmPayment(false)}
                style={{
                  padding: "8px 15px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#f5f5f5",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmPayment(true)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "rgb(140,92,52)",
                  color: "white",
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Section - Show when online is selected */}
      {paymentMethod === "online" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "90%",
                maxWidth: "600px",
                height: "auto",
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {successMessage && (
                <p style={{ fontSize: "16px", color: "#48bb78" }}>
                  {successMessage}
                </p>
              )}

              {isAmountNull && (
                <p style={{ fontSize: "14px", color: "black" }}>
                  Please enter the installment amount in scheme details.
                </p>
              )}

              <p style={{ fontSize: "18px", color: "black" }}>
                <strong>Amount:</strong> {activeSymbol}
                {parsedData && parsedData.installmentAmount <= 0
                  ? 0
                  : parsedData?.installmentAmount ?? "N/A"}
              </p>

              {isEsignEnabled && paymentStatus === "initial" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* eKYC or direct signature captured — no separate sign link needed */}
                  {hasEkycSignature && (
                    <div style={{ background: "#f0fff4", border: "1px solid #68d391", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#38a169", fontSize: "18px" }}>✅</span>
                      <span style={{ color: "#276749", fontSize: "13px", fontWeight: "600" }}>Customer signature captured — no sign link required</span>
                    </div>
                  )}

                  {/* No eKYC signature — send digital sign link first */}
                  {!hasEkycSignature && (
                    !signLinkSent ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={handleSendForDigitalSignature}
                          disabled={isSendingSignLink}
                          style={{
                            flex: 1,
                            backgroundColor: isSendingSignLink ? "#90aecb" : "#2b6cb0",
                            color: "#fff",
                            padding: "10px 15px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: isSendingSignLink ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {isSendingSignLink ? "⏳ Sending..." : "✍️ Send for Signature"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSignPadModal(true)}
                          style={{
                            flex: 1,
                            backgroundColor: "rgb(97, 65, 25)",
                            color: "#fff",
                            padding: "10px 15px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          📝 Sign Here (Direct)
                        </button>
                      </div>
                    ) : (
                      !isCustomerSigned ? (
                        <div style={{ background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#3182ce", fontSize: "18px" }}>⏳</span>
                          <span style={{ color: "#2b6cb0", fontSize: "13px", fontWeight: "600" }}>Waiting for customer to sign document...</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {/* Signed confirmation banner */}
                          <div style={{ background: "#f0fff4", border: "1px solid #68d391", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#38a169", fontSize: "18px" }}>✅</span>
                            <span style={{ color: "#276749", fontSize: "13px", fontWeight: "600" }}>Customer signed successfully!</span>
                          </div>

                          {/* Signed PDF preview */}
                          {signedPdfUrl && (
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
                              <div style={{ background: "#2d3748", color: "#fff", padding: "8px 12px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>📄 Signed Enrollment Form</span>
                                <a href={signedPdfUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ color: "#90cdf4", fontSize: "12px", textDecoration: "none" }}>
                                  Open in new tab ↗
                                </a>
                              </div>
                              <iframe
                                src={signedPdfUrl}
                                title="Signed Enrollment PDF"
                                width="100%"
                                height="420px"
                                style={{ border: "none", display: "block" }}
                              />
                            </div>
                          )}
                          {!signedPdfUrl && (
                            <div style={{ background: "#fffbeb", border: "1px solid #f6e05e", borderRadius: "6px", padding: "10px", fontSize: "13px", color: "#744210" }}>
                              ⚠️ Signed PDF link not yet available. You can still save the enrollment.
                            </div>
                          )}

                          {/* Save Enrollment button */}
                          <button
                            type="button"
                            disabled={isSavingAfterSign || !!userDraftid}
                            onClick={async () => {
                              if (typeof onRequestPreview === "function") {
                                onRequestPreview(paymentMethod || "offline");
                                return;
                              }
                              setIsSavingAfterSign(true);
                              try {
                                const draftId = await CallSaveDraft(paymentMethod || "offline");
                                if (draftId) {
                                  setuserDraftid(draftId);
                                  toast.success("✅ Enrollment saved successfully!");
                                } else {
                                  toast.error("Failed to save enrollment. Please try again.");
                                }
                              } catch (err) {
                                toast.error("Error saving enrollment.");
                              } finally {
                                setIsSavingAfterSign(false);
                              }
                            }}
                            style={{
                              backgroundColor: userDraftid ? "#68d391" : isSavingAfterSign ? "#9ae6b4" : "#38a169",
                              color: "#fff",
                              padding: "12px 20px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: (isSavingAfterSign || userDraftid) ? "not-allowed" : "pointer",
                              fontSize: "15px",
                              fontWeight: "700",
                              width: "100%",
                            }}
                          >
                            {userDraftid ? "✅ Enrollment Saved" : isSavingAfterSign ? "⏳ Saving..." : "💾 Save Enrollment"}
                          </button>
                        </div>
                      )
                    )
                  )}

                  {/* Pay now */}
                  <button
                    onClick={() => {
                      if (!isTermsChecked) {
                        toast.error("Please accept the Terms and Conditions");
                        return;
                      }
                      generatePaymentLink();
                    }}
                    style={{
                      backgroundColor: "rgb(97, 65, 25)",
                      color: "#fff",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    Pay now
                  </button>
                </div>
              )}

              {paymentStatus === "processing" && timeLeft !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  <button
                    style={{
                      backgroundColor: "green",
                      color: "#fff",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "not-allowed",
                      fontSize: "16px",
                      width: '100%'
                    }}
                    disabled
                  >
                    Make Payment in {formatTime(timeLeft)} Min
                  </button>
              {/* ////////// Cancel Payment button ////////////// */}
                  <button
                    style={{
                      backgroundColor: "red",
                      color: "#fff",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "16px",
                      width: '100%',
                      cursor: 'pointer'

                    }}
                    onClick={() => cancelPayment()}
                  >
                    Cancel Payment
                  </button>
                </div>
              )}

              {paymentStatus === "PAID" && (
                <button
                  style={{
                    backgroundColor: "#48bb78",
                    color: "#fff",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "not-allowed",
                    fontSize: "16px",
                  }}
                  disabled
                >
                  Paid
                </button>
              )}

              {paymentLink && (
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    backgroundColor: "#fff",
                    color: "#2575fc",
                    padding: "10px",
                    borderRadius: "5px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    marginTop: "10px",
                  }}
                >
                  Open Payment Link
                </a>
              )}

              {error && (
                <p style={{ color: "#f56565", marginTop: "20px" }}>{error}</p>
              )}
            </div>
          </div>
        </>
      )}

      {paymentMethod === "offline" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "15px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              height: "auto",
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <p style={{ fontSize: "18px", color: "black", margin: 0 }}>
              <strong>Amount:</strong> {formatCurrency(parsedData?.installmentAmount || 0, activeSymbol)}
            </p>

            {isEsignEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* eKYC or direct signature captured */}
                {hasEkycSignature && (
                  <div style={{ background: "#f0fff4", border: "1px solid #68d391", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                    <span style={{ color: "#38a169", fontSize: "18px" }}>✅</span>
                    <span style={{ color: "#276749", fontSize: "13px", fontWeight: "600" }}>Customer signature captured — no sign link required</span>
                  </div>
                )}

                {/* Signature Options: Send via Email/SMS link OR Sign Here Direct */}
                {!hasEkycSignature && (
                  !signLinkSent ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={handleSendForDigitalSignature}
                        disabled={isSendingSignLink}
                        style={{
                          flex: 1,
                          backgroundColor: isSendingSignLink ? "#90aecb" : "#2b6cb0",
                          color: "#fff",
                          padding: "10px 15px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: isSendingSignLink ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {isSendingSignLink ? "⏳ Sending..." : "✍️ Send for Signature"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSignPadModal(true)}
                        style={{
                          flex: 1,
                          backgroundColor: "rgb(97, 65, 25)",
                          color: "#fff",
                          padding: "10px 15px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        📝 Sign Here (Direct)
                      </button>
                    </div>
                  ) : (
                    !isCustomerSigned ? (
                      <div style={{ background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                        <span style={{ color: "#3182ce", fontSize: "18px" }}>⏳</span>
                        <span style={{ color: "#2b6cb0", fontSize: "13px", fontWeight: "600" }}>Waiting for customer to sign document...</span>
                      </div>
                    ) : (
                      <div style={{ background: "#f0fff4", border: "1px solid #68d391", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                        <span style={{ color: "#38a169", fontSize: "18px" }}>✅</span>
                        <span style={{ color: "#276749", fontSize: "13px", fontWeight: "600" }}>Customer signed successfully!</span>
                      </div>
                    )
                  )
                )}
              </div>
            )}

            <Button
                style={{
                  backgroundColor: "rgb(205, 154, 80)",
                  color: "white",
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
                onClick={() => {
                  if (!isTermsChecked) {
                    toast.error("Please accept the Terms and Conditions");
                    return;
                  }
                  if (typeof onRequestPreview === "function") {
                    onRequestPreview("offline");
                  } else {
                    SaveOffline();
                  }
                }}
              >
                {"Save Offline"}
              </Button>
            </div>
          </div>
        )}

      {showTermsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "25px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1.5px solid #e2e8f0",
                paddingBottom: "15px",
                marginBottom: "15px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  color: "#1c1917",
                  fontWeight: "bold",
                  lineHeight: 1.3,
                }}
              >
                {activeTerms.title}
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#6b7280",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "0 5px",
                }}
              >
                &times;
              </button>
            </div>

            {/* Clauses */}
            <div
              ref={termsModalContainerRef}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop - clientHeight <= 15) {
                  setHasReadTermsModal(true);
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "50vh",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              {activeTerms.clauses.map((clause, idx) => (
                <p
                  key={idx}
                  style={{
                    margin: 0,
                    fontSize: "13.5px",
                    color: "#44403c",
                    lineHeight: "1.5",
                    textAlign: "left",
                  }}
                >
                  {clause}
                </p>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1.5px solid #e2e8f0",
                paddingTop: "15px",
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {!hasReadTermsModal && (
                  <span style={{ fontSize: "12.5px", color: "#ef4444", fontWeight: "500" }}>
                    Please scroll down to read the full terms.
                  </span>
                )}
                {hasReadTermsModal && (
                  <span style={{ fontSize: "12.5px", color: "#16a34a", fontWeight: "500" }}>
                    ✓ Thank you for reading.
                  </span>
                )}
              </div>
              <button
                disabled={!hasReadTermsModal}
                onClick={() => {
                  setIsTermsChecked(true);
                  setShowTermsModal(false);
                }}
                style={{
                  backgroundColor: hasReadTermsModal ? "rgb(140, 92, 52)" : "#cbd5e1",
                  color: hasReadTermsModal ? "#ffffff" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: hasReadTermsModal ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                I Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showSignPadModal && (
        <SignaturePadModal
          open={showSignPadModal}
          onClose={() => setShowSignPadModal(false)}
          onSave={(signatureDataUrl) => {
            setEkycSignature(signatureDataUrl);
            setShowSignPadModal(false);
            toast.success("✅ Signature captured successfully!");
          }}
        />
      )}
    </>
  );
}

const SignaturePadModal = ({ open, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasCssHeight = () => {
    if (typeof window === "undefined") return 220;
    if (window.innerWidth < 481) return 180;
    if (window.innerWidth < 1025) return 220;
    return 250;
  };

  const paintBlankCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, Math.max(40, canvas.height - 50));
    ctx.lineTo(canvas.width - 20, Math.max(40, canvas.height - 50));
    ctx.stroke();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
  };

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(280, Math.floor(rect.width || 500));
      canvas.height = getCanvasCssHeight();
      paintBlankCanvas(canvas);
    };

    const t = setTimeout(resize, 30);
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintBlankCanvas(canvas);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  if (!open) return null;

  return (
    <div className="sign-pad-overlay" role="dialog" aria-modal="true">
      <div className="sign-pad-sheet">
        <h3 className="sign-pad-title">Draw Customer Signature</h3>
        <p className="sign-pad-hint">Use finger or mouse to sign inside the box</p>

        <div className="sign-pad-canvas-wrap">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="sign-pad-actions">
          <button type="button" className="sign-pad-clear" onClick={handleClear}>
            Clear
          </button>
          <button type="button" className="sign-pad-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="sign-pad-save" onClick={handleSave}>
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paymentgateway;
