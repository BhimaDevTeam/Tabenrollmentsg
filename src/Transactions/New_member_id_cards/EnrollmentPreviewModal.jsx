import React, { useState, useMemo, useRef, useEffect } from "react";
import { formatCurrency } from "../../utlis/currencyUtils";
import { formatDisplayDob } from "../PickDate/DateUtils";
import "./EnrollmentPreviewModal.css";

const EnrollmentPreviewModal = ({
  open,
  onClose,
  onConfirmSave,
  onEditSection,
  subscriberData = {},
  membershipData = {},
  nomineeData = {},
  guardaianData = {},
  showGuardianDetails = false,
  image = "",
  uploadedDocs = [],
  alldocs = [],
  ekycSignature = null,
  paymentMode = "offline",
  selectedCountry = "Singapore",
  currencySymbol = "S$",
  branch = "",
  isSaving = false,
}) => {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxCaption, setLightboxCaption] = useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const overlayRef = useRef(null);

  const activeSymbol = currencySymbol || (selectedCountry === "Singapore" ? "S$" : "₹");
  const isSingapore = selectedCountry === "Singapore";

  // Reset scroll detection when modal opens
  useEffect(() => {
    if (open) {
      setHasScrolledToBottom(false);

      const checkScrollable = () => {
        if (overlayRef.current) {
          const { scrollHeight, clientHeight } = overlayRef.current;
          // If content fits completely on screen without scrolling
          if (scrollHeight <= clientHeight + 40) {
            setHasScrolledToBottom(true);
          }
        }
      };

      const timer = setTimeout(checkScrollable, 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle scroll event to unlock save when near bottom
  const handleScroll = (e) => {
    if (hasScrolledToBottom) return;
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    // Unlock when within 90px of bottom
    if (scrollTop + clientHeight >= scrollHeight - 90) {
      setHasScrolledToBottom(true);
    }
  };

  const handleScrollToBottom = () => {
    if (overlayRef.current) {
      overlayRef.current.scrollTo({
        top: overlayRef.current.scrollHeight,
        behavior: "smooth",
      });
      setTimeout(() => setHasScrolledToBottom(true), 600);
    }
  };

  // Safe fallback string helper
  const valOrDash = (val) => {
    if (val === null || val === undefined) return "—";
    const str = String(val).trim();
    return str !== "" ? str : "—";
  };

  // Safe subscriber fields
  const subName = subscriberData.subscriberName || subscriberData.Cust_Name || subscriberData.name || subscriberData.Name || "";
  const subMobile = subscriberData.mobileNo || subscriberData.Mobile_No || subscriberData.mobile || subscriberData.phone || "";
  const subEmail = subscriberData.email || subscriberData.email_id || subscriberData.Email || "";
  const subGender = subscriberData.gender || subscriberData.Gender || "";
  const subDob = subscriberData.dob || subscriberData.DateOf_Birth || subscriberData.dateOfBirth || "";
  const subPincode = subscriberData.pinCode || subscriberData.Pin_Code || subscriberData.pincode || "";
  const subArea = subscriberData.area || subscriberData.Address3 || "";
  const subCity = subscriberData.city || subscriberData.City || "";
  const subState = subscriberData.state || subscriberData.State || "";
  const subAdd1 = subscriberData.address1 || subscriberData.Address1 || "";
  const subAdd2 = subscriberData.address2 || subscriberData.Address2 || "";
  const subAdd3 = subscriberData.address3 || subscriberData.Address3 || "";
  const subPermAdd = subscriberData.permanentAddress || subscriberData.PermanentAddress || "";

  // Safe nominee fields
  const nomName = nomineeData.nomineename || nomineeData.NomineName || nomineeData.NomineeName || nomineeData.nomineeName || nomineeData.name || "";
  const nomRel = nomineeData.relationshipName || nomineeData.relationship || nomineeData.NomineRelationship || nomineeData.NomineeRelationship || nomineeData.Relationship || "";
  const nomPhone = nomineeData.nomineephoneno || nomineeData.nomineePhone || nomineeData.NominePhone || nomineeData.NomineePhone || nomineeData.phone || "";
  const nomAddress = nomineeData.nomineeaddress || nomineeData.nomineeAddress || nomineeData.NomineAddress || nomineeData.NomineeAddress || nomineeData.address || "";

  // Safe guardian fields
  const guardName = guardaianData.guardname || guardaianData.GuardianName || guardaianData.guardName || "";
  const guardRel = guardaianData.guardrelationshipName || guardaianData.guardrelationship || guardaianData.GuardianRelation || guardaianData.guardRelationship || "";
  const guardGender = guardaianData.guardGender || guardaianData.Guardiangender || guardaianData.gender || "";
  const guardDob = guardaianData.guarddob || guardaianData.GuardianDOB || guardaianData.dob || "";

  // Compute full clean address
  const fullAddress = useMemo(() => {
    const parts = [
      subAdd1,
      subAdd2,
      subAdd3,
      subArea && subArea !== subAdd3 ? subArea : null,
      subCity,
      subState,
      subPincode
        ? isSingapore
          ? `Singapore ${subPincode}`
          : `PIN ${subPincode}`
        : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "";
  }, [subAdd1, subAdd2, subAdd3, subArea, subCity, subState, subPincode, isSingapore]);

  // Combine and deduplicate documents from uploadedDocs and alldocs
  const combinedDocs = useMemo(() => {
    const pool = [...(uploadedDocs || []), ...(alldocs || [])];
    const seen = new Set();
    const result = [];

    for (const doc of pool) {
      if (!doc) continue;
      const docId = String(doc.DocumentID ?? doc.documentTypeId ?? doc.DocumentTypeID ?? doc.docType ?? doc.id ?? "");
      const docNo = String(
        doc.Number || doc.number || doc.documentNo || doc.DocumentNo || doc.docNumber || doc.DocNumber || doc.Name || doc.name || ""
      ).trim().toUpperCase();
      const key = `${docId}_${docNo}`;

      // Skip plain profile webcam images from identity docs list
      const typeStr = String(doc.Type || doc.type || "").toUpperCase();
      if (typeStr.includes("IMG") && !docNo) continue;

      if (!seen.has(key)) {
        seen.add(key);
        result.push(doc);
      }
    }
    return result;
  }, [uploadedDocs, alldocs]);

  // Helper to determine user-friendly document type name
  const resolveDocName = (doc) => {
    if (!doc) return "Document";
    const directId = Number(doc.DocumentID ?? doc.documentTypeId ?? doc.DocumentTypeID ?? doc.docType ?? doc.id);
    const typeStr = String(doc.Type || doc.type || doc.name || doc.Name || doc.LovName || doc.lovName || "").toUpperCase().trim();
    const docNo = String(doc.Number || doc.documentNo || doc.Name || "").trim().toUpperCase();

    if (directId === 25 || typeStr.includes("NRIC") || typeStr === "PAN") {
      if (isSingapore || /^[STFGM][0-9]{7}[A-Z]$/i.test(docNo)) {
        return "NRIC Card";
      }
      return "PAN Card";
    }
    if (directId === 27 || typeStr.includes("FIN") || typeStr.includes("E-PASS") || typeStr === "VOT") {
      return isSingapore ? "E-Pass (FIN Number)" : "Voter ID Card";
    }
    if (directId === 28 || typeStr.includes("PASS") || typeStr === "PAS") return "Passport";
    if (directId === 26 || typeStr.includes("DRIV") || typeStr.includes("LICEN") || typeStr === "DRI") return "Driving License";
    if (directId === 29 || typeStr.includes("AAD")) return "Aadhaar Card";
    if (directId === 31 || typeStr.includes("BACK") || typeStr === "ADB") return "Aadhaar Back";
    if (directId === 24 || typeStr.includes("SCHEME") || typeStr === "SOD" || typeStr === "NEF") return "Scheme Opening Document";
    if (directId === 30 || typeStr.includes("PHOTO")) return "Profile Image";

    return doc.LovName || doc.Name || doc.Type || "Identity Document";
  };

  const resolveDocNumber = (doc) => {
    if (!doc) return "—";
    const num = doc.Number || doc.number || doc.documentNo || doc.DocumentNo || doc.docNumber || doc.DocNumber || doc.Name || doc.name;
    return num && String(num).trim() !== "" ? String(num).trim() : "—";
  };

  const resolveDocImage = (doc) => {
    if (!doc) return null;
    const direct = doc.ImagePath || doc.imagePath || doc.ImageURL || doc.imageUrl || doc.file || doc.preview;
    if (direct && typeof direct === "string" && direct.trim() !== "") {
      const trimmed = direct.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
        return trimmed;
      }
      return `https://tabenrollment.bhimagold.com/${trimmed.replace(/^\/+/, "")}`;
    }
    return null;
  };

  const handleOpenLightbox = (imgSrc, caption = "") => {
    if (!imgSrc) return;
    setLightboxImage(imgSrc);
    setLightboxCaption(caption);
  };

  // Calculate estimated maturity date if not in data (11 months after start date)
  const estimatedMaturity = useMemo(() => {
    if (membershipData.maturityDate) return membershipData.maturityDate;
    try {
      const startDateStr = membershipData.startDate || new Date().toISOString().split("T")[0];
      const d = new Date(startDateStr);
      if (!isNaN(d.getTime())) {
        d.setMonth(d.getMonth() + 11);
        return d.toISOString().split("T")[0];
      }
    } catch {}
    return "After 11 Months";
  }, [membershipData]);

  if (!open) return null;

  return (
    <div className="epm-overlay" ref={overlayRef} onScroll={handleScroll}>
      <div className="epm-container">
        {/* ─── Top Header Bar ─── */}
        <header className="epm-header">
          <div className="epm-header-left">
            <img
              src={`${process.env.PUBLIC_URL || ""}/images/bhima_logo3.png`}
              alt="Bhima Gold"
              className="epm-brand-logo"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="epm-header-titles">
              <h2>
                <i className="bi bi-file-earmark-text-fill text-warning"></i>
                MEMBERSHIP ENROLLMENT APPLICATION
              </h2>
              <p>Complete Form Preview & Verification before Final Save</p>
            </div>
          </div>

          <div className="epm-header-right">
            <span className="epm-badge-country">
              {isSingapore ? "🇸🇬 Singapore" : "🇮🇳 India"}
            </span>
            <button
              type="button"
              className="epm-header-edit-btn"
              onClick={() => onEditSection && onEditSection("subscriber-header")}
              title="Return to form to edit details"
            >
              <i className="bi bi-pencil-square"></i>
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              className="epm-btn-close"
              onClick={onClose}
              aria-label="Close"
              title="Close Preview"
            >
              &times;
            </button>
          </div>
        </header>

        {/* ─── Full-Screen Scrollable Document Body ─── */}
        <main className="epm-body">
          {/* Status Alert Banner */}
          <div className="epm-alert-banner">
            <div className="epm-alert-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="epm-alert-text">
              <strong>Application Form Preview & Verification</strong>
              <span>
                Please verify all personal details, scheme selection, nominee, and uploaded documents.
                Click <strong>"Edit"</strong> on any section below to make adjustments, or click <strong>"Confirm & Save Enrollment"</strong> at the bottom to complete your registration.
              </span>
            </div>
          </div>

          {/* Hero Profile Summary Card */}
          <div className="epm-hero-card">
            <div className="epm-avatar-wrap">
              {image ? (
                <>
                  <img
                    src={image}
                    alt="Customer"
                    className="epm-avatar-img"
                    onClick={() => handleOpenLightbox(image, "Customer Photo")}
                    style={{ cursor: "pointer" }}
                    title="Click to zoom photo"
                  />
                  <span className="epm-avatar-badge" title="Live Photo Captured">
                    <i className="bi bi-check-lg"></i>
                  </span>
                </>
              ) : (
                <div className="epm-avatar-placeholder">
                  <i className="bi bi-camera"></i>
                  <span>No Photo</span>
                </div>
              )}
            </div>

            <div className="epm-hero-details">
              <div className="epm-hero-top-row">
                <div>
                  <span className="epm-hero-tag">APPLICANT NAME</span>
                  <h3 className="epm-hero-name">
                    {subName || "Applicant Name"}
                  </h3>
                </div>
                <div className="epm-hero-branch-pill">
                  <i className="bi bi-geo-alt-fill"></i>
                  <span>Branch: <strong>{branch || membershipData.branch || "SG"}</strong></span>
                </div>
              </div>

              <div className="epm-hero-meta">
                {subMobile && (
                  <span className="epm-meta-chip">
                    <i className="bi bi-telephone-fill"></i>
                    {isSingapore ? "+65 " : "+91 "}
                    {subMobile}
                  </span>
                )}
                {subEmail && (
                  <span className="epm-meta-chip">
                    <i className="bi bi-envelope-fill"></i>
                    {subEmail}
                  </span>
                )}
                {subGender && (
                  <span className="epm-meta-chip">
                    <i className="bi bi-person-fill"></i>
                    {subGender}
                  </span>
                )}
                {subDob && (
                  <span className="epm-meta-chip">
                    <i className="bi bi-calendar3"></i>
                    DOB: {formatDisplayDob(subDob)}
                  </span>
                )}
              </div>

              <div className="epm-hero-scheme-tag">
                <div className="epm-scheme-badge-icon">
                  <i className="bi bi-gem"></i>
                </div>
                <div className="epm-scheme-badge-info">
                  <span className="epm-scheme-badge-title">Selected Scheme</span>
                  <strong className="epm-scheme-badge-name">
                    {membershipData.selectedSchemeName || "Scheme Not Selected"}
                  </strong>
                </div>
                {membershipData.installmentAmount && (
                  <div className="epm-scheme-badge-amount">
                    <span>Monthly Installment:</span>
                    <strong>{formatCurrency(membershipData.installmentAmount, activeSymbol)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── SECTION 1: Personal & Subscriber Details ─── */}
          <section className="epm-form-section">
            <div className="epm-section-header">
              <div className="epm-section-title-wrap">
                <span className="epm-section-num">1</span>
                <div>
                  <h4 className="epm-section-title">Personal & Subscriber Details</h4>
                  <p className="epm-section-subtitle">Primary applicant personal and residential information</p>
                </div>
              </div>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("subscriber-header")}
              >
                <i className="bi bi-pencil"></i> Edit Details
              </button>
            </div>

            <div className="epm-section-body">
              <div className="epm-form-grid">
                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-person"></i> Full Name
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subName)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-telephone"></i> Mobile Number
                  </label>
                  <div className="epm-field-box">
                    {subMobile ? `${isSingapore ? "+65 " : "+91 "}${subMobile}` : "—"}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-envelope"></i> Email Address
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subEmail)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-gender-ambiguous"></i> Gender
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subGender)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-calendar-event"></i> Date of Birth
                  </label>
                  <div className="epm-field-box">
                    {formatDisplayDob(subDob)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-geo"></i> Postal / PIN Code
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subPincode)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-pin-map"></i> Area / Locality
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subArea)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-building"></i> City
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subCity)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-flag"></i> State / Country
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subState || (isSingapore ? "Singapore" : ""))}
                  </div>
                </div>

                <div className="epm-form-field epm-col-span-2">
                  <label className="epm-field-label">
                    <i className="bi bi-house-door"></i> Address Line 1
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(subAdd1)}
                  </div>
                </div>

                {(subAdd2 || subAdd3) && (
                  <div className="epm-form-field epm-col-span-2">
                    <label className="epm-field-label">
                      <i className="bi bi-house-door"></i> Address Line 2 & 3
                    </label>
                    <div className="epm-field-box">
                      {[subAdd2, subAdd3].filter(Boolean).join(", ")}
                    </div>
                  </div>
                )}

                <div className="epm-form-field epm-col-span-full">
                  <label className="epm-field-label">
                    <i className="bi bi-map"></i> Complete Residential Address
                  </label>
                  <div className="epm-field-box epm-field-box-highlight">
                    {valOrDash(fullAddress)}
                  </div>
                </div>

                {subPermAdd && (
                  <div className="epm-form-field epm-col-span-full">
                    <label className="epm-field-label">
                      <i className="bi bi-signpost-2"></i> Permanent Address
                    </label>
                    <div className="epm-field-box">
                      {subPermAdd}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ─── SECTION 2: Plan & Membership Details ─── */}
          <section className="epm-form-section">
            <div className="epm-section-header">
              <div className="epm-section-title-wrap">
                <span className="epm-section-num">2</span>
                <div>
                  <h4 className="epm-section-title">Plan & Membership Details</h4>
                  <p className="epm-section-subtitle">Selected installment plan, branch, and maturity parameters</p>
                </div>
              </div>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("membership-header")}
              >
                <i className="bi bi-pencil"></i> Edit Plan
              </button>
            </div>

            <div className="epm-section-body">
              <div className="epm-scheme-stats-bar">
                <div className="epm-stat-card primary">
                  <span className="epm-stat-label">SELECTED PLAN</span>
                  <span className="epm-stat-val">
                    {valOrDash(membershipData.selectedSchemeName)}
                  </span>
                </div>
                <div className="epm-stat-card highlight">
                  <span className="epm-stat-label">MONTHLY INSTALLMENT</span>
                  <span className="epm-stat-val">
                    {formatCurrency(membershipData.installmentAmount || 0, activeSymbol)}
                  </span>
                </div>
                <div className="epm-stat-card">
                  <span className="epm-stat-label">TENURE DURATION</span>
                  <span className="epm-stat-val">
                    {membershipData.noOfInstallments || 11} Months
                  </span>
                </div>
                <div className="epm-stat-card">
                  <span className="epm-stat-label">ESTIMATED MATURITY</span>
                  <span className="epm-stat-val">
                    {formatDisplayDob(estimatedMaturity)}
                  </span>
                </div>
              </div>

              <div className="epm-form-grid" style={{ marginTop: "16px" }}>
                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-upc-scan"></i> Plan Code
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(membershipData.selectedSchemeCode)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-tag"></i> Plan Type
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(membershipData.schemeType || "Value Plan")}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-calendar-check"></i> Plan Start Date
                  </label>
                  <div className="epm-field-box">
                    {formatDisplayDob(membershipData.startDate || new Date().toISOString().split("T")[0])}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-shop"></i> Branch Code
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(branch || membershipData.branch || "SG")}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── SECTION 3: Nominee Details ─── */}
          <section className="epm-form-section">
            <div className="epm-section-header">
              <div className="epm-section-title-wrap">
                <span className="epm-section-num">3</span>
                <div>
                  <h4 className="epm-section-title">Nominee Details</h4>
                  <p className="epm-section-subtitle">Beneficiary information assigned to this membership plan</p>
                </div>
              </div>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("nominee-header")}
              >
                <i className="bi bi-pencil"></i> Edit Nominee
              </button>
            </div>

            <div className="epm-section-body">
              <div className="epm-form-grid">
                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-person-heart"></i> Nominee Full Name
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(nomName)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-people"></i> Relationship to Applicant
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(nomRel)}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-telephone"></i> Nominee Contact Number
                  </label>
                  <div className="epm-field-box">
                    {nomPhone ? `${isSingapore ? "+65 " : "+91 "}${nomPhone}` : "—"}
                  </div>
                </div>

                <div className="epm-form-field epm-col-span-full">
                  <label className="epm-field-label">
                    <i className="bi bi-house"></i> Nominee Residential Address
                  </label>
                  <div className="epm-field-box">
                    {valOrDash(nomAddress || (subName ? "Same as Subscriber Address" : "—"))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── SECTION 4: Guardian Details (Only if Minor / Guardian present) ─── */}
          {(showGuardianDetails || guardName) && (
            <section className="epm-form-section">
              <div className="epm-section-header">
                <div className="epm-section-title-wrap">
                  <span className="epm-section-num">4</span>
                  <div>
                    <h4 className="epm-section-title">Guardian Details (for Minor)</h4>
                    <p className="epm-section-subtitle">Appointed legal guardian information</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="epm-btn-edit-sec"
                  onClick={() => onEditSection && onEditSection("guardian-header")}
                >
                  <i className="bi bi-pencil"></i> Edit Guardian
                </button>
              </div>

              <div className="epm-section-body">
                <div className="epm-form-grid">
                  <div className="epm-form-field">
                    <label className="epm-field-label">
                      <i className="bi bi-shield-person"></i> Guardian Name
                    </label>
                    <div className="epm-field-box">
                      {valOrDash(guardName)}
                    </div>
                  </div>

                  <div className="epm-form-field">
                    <label className="epm-field-label">
                      <i className="bi bi-people"></i> Relationship to Nominee
                    </label>
                    <div className="epm-field-box">
                      {valOrDash(guardRel)}
                    </div>
                  </div>

                  <div className="epm-form-field">
                    <label className="epm-field-label">
                      <i className="bi bi-gender-ambiguous"></i> Guardian Gender
                    </label>
                    <div className="epm-field-box">
                      {valOrDash(guardGender)}
                    </div>
                  </div>

                  <div className="epm-form-field">
                    <label className="epm-field-label">
                      <i className="bi bi-calendar-event"></i> Guardian Date of Birth
                    </label>
                    <div className="epm-field-box">
                      {formatDisplayDob(guardDob)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── SECTION 5: Identity & Uploaded Documents ─── */}
          <section className="epm-form-section">
            <div className="epm-section-header">
              <div className="epm-section-title-wrap">
                <span className="epm-section-num">{showGuardianDetails || guardName ? "5" : "4"}</span>
                <div>
                  <h4 className="epm-section-title">Identity & Uploaded Documents</h4>
                  <p className="epm-section-subtitle">Government-issued identity cards and proof documents submitted</p>
                </div>
              </div>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("uploaddoc-header")}
              >
                <i className="bi bi-pencil"></i> Edit Docs
              </button>
            </div>

            <div className="epm-section-body">
              {combinedDocs.length > 0 ? (
                <div className="epm-docs-grid">
                  {combinedDocs.map((doc, idx) => {
                    const docName = resolveDocName(doc);
                    const docNumber = resolveDocNumber(doc);
                    const docImage = resolveDocImage(doc);

                    return (
                      <div className="epm-doc-card" key={idx}>
                        <div className="epm-doc-head">
                          <span className="epm-doc-type-badge">
                            <i className="bi bi-file-earmark-check-fill text-warning"></i>
                            {docName}
                          </span>
                          <span className="epm-doc-seq-badge">
                            Doc #{idx + 1}
                          </span>
                        </div>

                        <div className="epm-doc-number-row">
                          <span className="epm-doc-num-label">DOCUMENT NUMBER:</span>
                          <span className="doc-id-pill">{docNumber}</span>
                        </div>

                        <div
                          className="epm-doc-preview-box"
                          onClick={() => handleOpenLightbox(docImage, `${docName} (${docNumber})`)}
                          title={docImage ? "Click to view full image" : "No image preview available"}
                        >
                          {docImage ? (
                            <>
                              <img
                                src={docImage}
                                alt={docName}
                                className="epm-doc-img"
                              />
                              <div className="epm-doc-hover-overlay">
                                <i className="bi bi-arrows-fullscreen"></i>
                                <span>Click to Zoom</span>
                              </div>
                            </>
                          ) : (
                            <div className="epm-doc-empty">
                              <i className="bi bi-file-earmark-arrow-up"></i>
                              <span>Document on record</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="epm-no-docs-banner">
                  <i className="bi bi-info-circle-fill"></i>
                  <div>
                    <strong>No Identity Documents Uploaded</strong>
                    <p>Identity documents are optional for Singapore enrollments below the $20,000 threshold.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ─── SECTION 6: Customer Photograph ─── */}
          <section className="epm-form-section">
            <div className="epm-section-header">
              <div className="epm-section-title-wrap">
                <span className="epm-section-num">{showGuardianDetails || guardName ? "6" : "5"}</span>
                <div>
                  <h4 className="epm-section-title">Customer Photograph</h4>
                  <p className="epm-section-subtitle">Live photo verification captured during registration</p>
                </div>
              </div>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("camera-header")}
              >
                <i className="bi bi-pencil"></i> Edit Photo
              </button>
            </div>

            <div className="epm-section-body">
              <div className="epm-proofs-grid" style={{ gridTemplateColumns: "1fr" }}>
                {/* Photo Proof */}
                <div className="epm-proof-card">
                  <div className="epm-proof-head">
                    <i className="bi bi-camera-fill text-warning"></i>
                    <span>Live Customer Photograph</span>
                  </div>
                  <div className="epm-proof-box">
                    {image ? (
                      <div
                        className="epm-proof-img-wrap"
                        onClick={() => handleOpenLightbox(image, "Live Customer Photograph")}
                        title="Click to zoom photograph"
                      >
                        <img
                          src={image}
                          alt="Customer Capture"
                          className="epm-proof-img"
                        />
                        <div className="epm-proof-hover">
                          <i className="bi bi-zoom-in"></i> Click to Zoom
                        </div>
                        <span className="epm-proof-status-tag verified">
                          <i className="bi bi-check-circle-fill"></i> Live Photo Captured
                        </span>
                      </div>
                    ) : (
                      <div className="epm-proof-empty">
                        <i className="bi bi-camera"></i>
                        <span>No photo captured</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Digital Signature — commented out as requested */}
                {/*
                <div className="epm-proof-card">
                  <div className="epm-proof-head">
                    <i className="bi bi-pen-fill text-warning"></i>
                    <span>Customer Digital Signature</span>
                  </div>
                  <div className="epm-proof-box">
                    {ekycSignature ? (
                      <div
                        className="epm-proof-img-wrap"
                        onClick={() => handleOpenLightbox(ekycSignature, "Customer Signature")}
                        title="Click to zoom signature"
                      >
                        <img
                          src={ekycSignature}
                          alt="Customer Signature"
                          className="epm-proof-img"
                        />
                        <div className="epm-proof-hover">
                          <i className="bi bi-zoom-in"></i> Click to Zoom
                        </div>
                        <span className="epm-proof-status-tag verified">
                          <i className="bi bi-check-circle-fill"></i> Digital Signature Verified
                        </span>
                      </div>
                    ) : (
                      <div className="epm-proof-empty">
                        <i className="bi bi-pencil"></i>
                        <span>Digital signature will be recorded & confirmed upon final submission</span>
                      </div>
                    )}
                  </div>
                </div>
                */}
              </div>
            </div>
          </section>

          {/* ─── SECTION 7: Payment Mode & Declaration ─── */}
          <section className="epm-form-section">
            <div className="epm-section-header">
              <div className="epm-section-title-wrap">
                <span className="epm-section-num">{showGuardianDetails || guardName ? "7" : "6"}</span>
                <div>
                  <h4 className="epm-section-title">Payment Mode & Declaration</h4>
                  <p className="epm-section-subtitle">Payment method, amount payable, and applicant consent</p>
                </div>
              </div>
            </div>

            <div className="epm-section-body">
              <div className="epm-form-grid">
                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-credit-card-2-front"></i> Selected Payment Mode
                  </label>
                  <div className="epm-field-box epm-payment-badge">
                    {paymentMode === "online" ? "💳 Online Payment" : "🏬 Store Visit / Offline Payment"}
                  </div>
                </div>

                <div className="epm-form-field">
                  <label className="epm-field-label">
                    <i className="bi bi-cash-stack"></i> First Installment Payable
                  </label>
                  <div className="epm-field-box epm-amount-highlight">
                    {formatCurrency(membershipData.installmentAmount || 0, activeSymbol)}
                  </div>
                </div>

                <div className="epm-form-field epm-col-span-full">
                  <label className="epm-field-label">
                    <i className="bi bi-check-circle"></i> Applicant Terms & Verification Declaration
                  </label>
                  <div className="epm-declaration-box">
                    <i className="bi bi-shield-check text-success fs-5"></i>
                    <span>
                      I hereby declare and confirm that all details, personal information, and documents provided
                      in this application form are accurate, complete, and legally binding under the Bhima Gold
                      Scheme Terms and Conditions.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ─── Fixed Bottom Footer Action Bar ─── */}
        <footer className="epm-footer">
          <div className="epm-footer-left">
            <button
              type="button"
              className="epm-btn-edit-footer"
              onClick={() => onEditSection && onEditSection("subscriber-header")}
              title="Return to form to edit details"
            >
              <i className="bi bi-arrow-left"></i>
              <span className="epm-text-desktop">Back to Edit Form</span>
              <span className="epm-text-mobile">Edit Form</span>
            </button>
          </div>

          <div className="epm-footer-right">
            {!hasScrolledToBottom && (
              <button
                type="button"
                className="epm-btn-scroll-down"
                onClick={handleScrollToBottom}
                title="Scroll down to complete review and enable save"
              >
                <i className="bi bi-arrow-down-circle"></i>
                <span className="epm-text-desktop">Scroll to Bottom to Enable Save</span>
                <span className="epm-text-mobile">Scroll to Bottom</span>
              </button>
            )}
            <button
              type="button"
              className="epm-btn-cancel-footer"
              onClick={onClose}
              title="Close preview"
            >
              Cancel
            </button>
            <button
              type="button"
              className={`epm-btn-save-footer ${!hasScrolledToBottom ? "disabled-scroll-lock" : ""}`}
              disabled={isSaving || !hasScrolledToBottom}
              onClick={onConfirmSave}
              title={
                !hasScrolledToBottom
                  ? "Please scroll to the bottom of the page to review all details before confirming"
                  : "Confirm details and save enrollment"
              }
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle fs-5"></i>
                  <span className="epm-text-desktop">Confirm & Save Enrollment</span>
                  <span className="epm-text-mobile">Confirm & Save</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* ─── Full-screen Image Zoom Lightbox ─── */}
      {lightboxImage && (
        <div
          className="epm-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div className="epm-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="epm-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <img
              src={lightboxImage}
              alt="Zoomed Preview"
              className="epm-lightbox-img"
            />
            {lightboxCaption && (
              <div className="epm-lightbox-caption">{lightboxCaption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentPreviewModal;
