import React, { useState, useEffect } from "react";
import { COLLECTION_API } from "./apiurl";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { formatCurrency } from "./utlis/currencyUtils";
import { setSelectedCountry } from "./redux/customer/customerSlice";

// Singapore branch codes — always locked to Singapore
const SINGAPORE_BRANCHES = ["LN", "LI", "BGSG"];

const isSingaporeBranch = (branchCode) => {
  if (!branchCode) return false;
  return SINGAPORE_BRANCHES.includes((branchCode || "").toUpperCase().trim());
};

const Header = ({ branch }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { currencySymbol, selectedCountry, isCountryLocked } = useSelector((state) => state.customer || {});
  const activeSymbol = currencySymbol || "₹";
  const currentCountry = selectedCountry || "India";

  // Lock country selection when branch URL is present OR on enrollment sub-pages
  const currentPath = (location.pathname || "").toLowerCase();
  const isPageLocked = currentPath.includes("mobilever") || currentPath.includes("mypage");

  const storedBranch = typeof window !== "undefined" ? localStorage.getItem("decodedBranch") : null;
  const urlHasBranch = typeof window !== "undefined"
    ? !!(new URLSearchParams(window.location.search).get("branch") || new URLSearchParams(window.location.search).get("BRANCH"))
    : false;
  const isSgBranch = isSingaporeBranch(storedBranch) || isSingaporeBranch(branch);

  // Always lock when opened with a branch URL (India or Singapore) — country cannot be changed
  const isLocked = isPageLocked || isSgBranch || !!storedBranch || urlHasBranch || !!isCountryLocked;

  const [rates, setRates] = useState({
    silver: null,
    gold22: null,
    gold24: null,
    gold18: null,
  });
  const [displayBranch, setDisplayBranch] = useState("KRM");


  // ─── Decode branch: always try Base64 (TE4= → LN, S1JN → KRM, etc.) ───────
  const decodeBranch = (raw) => {
    if (!raw) return null;
    const value = String(raw).trim();
    try {
      const decoded = decodeURIComponent(atob(value));
      // Only accept if decoded result looks like a plain branch code (letters/digits)
      if (/^[A-Za-z0-9_-]+$/.test(decoded)) return decoded.toUpperCase();
    } catch {}
    return value.toUpperCase(); // return as-is if not valid Base64
  };

  useEffect(() => {
    // Priority 1: Read from prop or URL query param directly
    let raw = branch;
    if (!raw && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      raw = urlParams.get("branch") || urlParams.get("BRANCH") || urlParams.get("Branch") || null;
    }

    let cleanBranch = null;
    if (raw) {
      cleanBranch = decodeBranch(raw);
    } else if (typeof window !== "undefined") {
      // Priority 2: Use localStorage ONLY if on an inner enrollment subpage
      const currentPath = (location.pathname || window.location.pathname || "").toLowerCase();
      const isSubPage =
        currentPath.includes("mobilever") ||
        currentPath.includes("mypage") ||
        currentPath.includes("ekyc") ||
        currentPath.includes("success-page") ||
        currentPath.includes("aadharver");
      if (isSubPage) {
        cleanBranch = localStorage.getItem("decodedBranch");
      }
    }

    // Default to "LI" for Singapore app, otherwise "KRM"
    const isSgHost = typeof window !== "undefined" && (
      window.location.pathname.toLowerCase().includes("vrudhitabenrollmentsg") ||
      window.location.hostname.toLowerCase().includes("tabenrollmentsg")
    );
    const defaultBranchCode = isSgHost ? "LI" : "KRM";
    const finalBranch = (cleanBranch || defaultBranchCode).toUpperCase();
    // For Singapore, LN maps to LI; BGSG keeps its branch code
    const displayFinalBranch = finalBranch === "LN" ? "LI" : finalBranch;
    setDisplayBranch(displayFinalBranch);
    fetchRates(finalBranch);
  }, [branch, location.search, location.pathname, selectedCountry]); // re-fetch when country changes (India ↔ Singapore)

  const fetchRates = async (branchCode) => {
    // Detect Singapore by Redux state OR by branch code directly (handles first load race)
    const sgBranches = ["LN", "LI", "BGSG"];
    const isSingapore = currentCountry === "Singapore"
      || sgBranches.includes((branchCode || "").toUpperCase().trim())
      || (typeof window !== "undefined" && (
        window.location.pathname.toLowerCase().includes("vrudhitabenrollmentsg") ||
        window.location.hostname.toLowerCase().includes("tabenrollmentsg")
      ))
      || localStorage.getItem("selectedCountry") === "Singapore";

    // For Singapore, LN maps to li; BGSG keeps bgsg; LI keeps li
    const targetBranch = isSingapore
      ? ((branchCode || "").toUpperCase().trim() === "LN" ? "li" : ((branchCode || "").toLowerCase().trim() || "li"))
      : branchCode;

    // For Singapore, gold and silver rates are fetched strictly from VrudhiPortalAPISG by branch
    // For India, use VrudhiPortalAPI with fallback to DraftEnrollmentApi
    const primaryUrl = isSingapore
      ? `https://suvarnagopura.com/VrudhiPortalAPISG/api/payment-gateway/goldrate-details/${targetBranch}`
      : `https://vrudhi.bhima.info/VrudhiPortalAPI/api/payment-gateway/goldrate-details/${targetBranch.toLowerCase()}`;
    const fallbackUrl = isSingapore
      ? `https://suvarnagopura.com/VrudhiPortalAPISG/api/payment-gateway/goldrate-details/${targetBranch}`
      : `${COLLECTION_API}/goldrate?branch=${targetBranch.toUpperCase()}`;

    try {
      let data = null;
      try {
        const fetchOptions = {
          headers: {
            Key: "WEYA5TXDZCEEZFG9CLATH37HFV84AMH6794CVYGVY8WXS52",
          },
        };
        const response = await fetch(primaryUrl, fetchOptions);
        if (response.ok) {
          const resObj = await response.json();
          data = Array.isArray(resObj) ? resObj : (resObj.data || resObj.value || null);
        }
      } catch (err) {
        console.warn("Primary goldrate API failed, trying fallback:", err);
      }

      if (!data || !Array.isArray(data) || data.length === 0 || data.Message) {
        const response = await fetch(fallbackUrl, {
          headers: {
            Key: "WEYA5TXDZCEEZFG9CLATH37HFV84AMH6794CVYGVY8WXS52",
          },
        });
        if (response.ok) {
          const resObj = await response.json();
          data = Array.isArray(resObj) ? resObj : (resObj.data || resObj.value || null);
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        let silver = null;
        let silverCoin = null;
        let gold22 = null;
        let gold24 = null;
        let gold18 = null;

        data.forEach((item) => {
          const id = Number(item.CommodityTypeID);
          const rate = Number(item.Rate);
          if (id === 2 && !silver) silver = rate;
          if (id === 7 && !silverCoin) silverCoin = rate;
          if ((id === 1 || id === 5) && !gold22) gold22 = rate;
          if ((id === 3 || id === 8) && !gold24) gold24 = rate;
          if (id === 6 && !gold18) gold18 = rate;
        });

        // Prioritize CommodityTypeID 7 (Silver Coin: 3.5) as requested, fallback to CommodityTypeID 2 (Silver: 4)
        const finalSilver = silverCoin ?? silver;
        setRates({ silver: finalSilver, gold22, gold24, gold18 });
      }
    } catch (err) {
      console.warn("Failed to fetch gold rates:", err);
    }
  };

  const handleCountrySelect = (country) => {
    if (isLocked) {
      return;
    }
    dispatch(setSelectedCountry(country));
  };

  const isSingaporeActive = currentCountry === "Singapore" || (typeof window !== "undefined" && window.location.pathname.toLowerCase().includes("vrudhitabenrollmentsg"));
  const defaultSilver = isSingaporeActive ? `${activeSymbol}2.83/g` : `${activeSymbol}355/g`;
  const defaultGold = isSingaporeActive ? `${activeSymbol}178/g` : `${activeSymbol}14,650/g`;
  const silverRate = rates.silver ? `${formatCurrency(rates.silver, activeSymbol)}/g` : defaultSilver;
  const gold22Rate = rates.gold22 ? `${formatCurrency(rates.gold22, activeSymbol)}/g` : defaultGold;

  return (
    <div className="app-rates-header" style={{ width: "100%", maxWidth: "1100px", margin: "0 auto 8px auto", padding: "0 4px", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}>
      <div className="app-rates-bar">
        <div className="app-rates-row">
          <div className="app-rates-left">
            <span className="app-rates-badge">✦ RATES</span>
            {displayBranch && (
              <span className="app-rates-branch-badge" title={`Branch Code: ${displayBranch}`}>
                <span style={{ fontSize: "10px", color: "#fcde7e" }}>📍</span>
                <span className="app-branch-full">Branch: {displayBranch}</span>
                <span className="app-branch-short">{displayBranch}</span>
              </span>
            )}
            <span className="app-rate-item">
              <span className="app-rate-label silver">Silver</span>
              <span className="app-rate-value">{silverRate}</span>
            </span>
            <span className="app-rate-sep">|</span>
            <span className="app-rate-item">
              <span className="app-rate-label gold">22K Gold</span>
              <span className="app-rate-value">{gold22Rate}</span>
            </span>
          </div>

          <div className="app-country-chip">
            {isLocked ? (
              <span className="app-country-active" title={currentCountry === "Singapore" ? "Singapore" : "India"}>
                <span>{currentCountry === "Singapore" ? "🇸🇬" : "🇮🇳"}</span>
                <span className="app-country-name app-country-short">{currentCountry === "Singapore" ? "SG" : "IN"}</span>
                <span className="app-country-name app-country-full">{currentCountry === "Singapore" ? "Singapore" : "India"}</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className={`app-country-btn${currentCountry === "India" ? " is-active" : ""}`}
                  onClick={() => handleCountrySelect("India")}
                >
                  <span className="app-country-short">🇮🇳 IN</span>
                  <span className="app-country-full">🇮🇳 India</span>
                </button>
                <button
                  type="button"
                  className={`app-country-btn${currentCountry === "Singapore" ? " is-active" : ""}`}
                  onClick={() => handleCountrySelect("Singapore")}
                >
                  <span className="app-country-short">🇸🇬 SG</span>
                  <span className="app-country-full">🇸🇬 Singapore</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
