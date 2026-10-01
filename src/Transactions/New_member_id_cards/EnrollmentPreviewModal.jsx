import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../utlis/currencyUtils";
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

  const activeSymbol = currencySymbol || (selectedCountry === "Singapore" ? "S$" : "₹");
  const isSingapore = selectedCountry === "Singapore";

  // Resolve clean address string
  const fullAddress = useMemo(() => {
    const parts = [
      subscriberData.address1,
      subscriberData.address2,
      subscriberData.address3,
      subscriberData.city,
      subscriberData.state,
      subscriberData.pinCode ? (isSingapore ? `Singapore ${subscriberData.pinCode}` : subscriberData.pinCode) : "",
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  }, [subscriberData, isSingapore]);

  // Combine and deduplicate documents from uploadedDocs and alldocs
  const combinedDocs = useMemo(() => {
    const pool = [...(uploadedDocs || []), ...(alldocs || [])];
    const seen = new Set();
    const result = [];

    for (const doc of pool) {
      if (!doc) continue;
      const docId = String(doc.DocumentID ?? doc.documentTypeId ?? doc.DocumentTypeID ?? doc.docType ?? doc.id ?? "");
      const docNo = String(doc.Number || doc.number || doc.documentNo || doc.DocumentNo || doc.docNumber || doc.DocNumber || doc.Name || doc.name || "").trim().toUpperCase();
      const key = `${docId}_${docNo}`;

      // Skip profile images from doc list if they are just the webcam avatar
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
    return (num && String(num).trim() !== "") ? String(num).trim() : "—";
  };

  const resolveDocImage = (doc) => {
    if (!doc) return null;
    let src = doc.ImagePath || doc.imagePath || doc.ImageURL || doc.imageURL || doc.ImageUrl || doc.imageUrl;
    if (!src && doc.file instanceof Blob) {
      try {
        src = URL.createObjectURL(doc.file);
      } catch (e) {}
    }
    if (!src) {
      const upperType = String(doc.Type || doc.type || "").toUpperCase();
      if (upperType.includes("AAD") || doc.documentTypeId === 29) {
        src = `${process.env.PUBLIC_URL}/images/aadhardummy.png`;
      } else if (upperType.includes("PAN") || upperType.includes("NRIC") || doc.documentTypeId === 25) {
        src = `${process.env.PUBLIC_URL}/images/pandummy.png`;
      }
    }
    return src;
  };

  const handleOpenLightbox = (imgSrc, caption) => {
    if (!imgSrc) return;
    setLightboxImage(imgSrc);
    setLightboxCaption(caption || "Document Preview");
  };

  if (!open) return null;

  return (
    <div className="epm-overlay" onClick={onClose}>
      <div className="epm-container" onClick={(e) => e.stopPropagation()}>
        {/* ─── Header ─── */}
        <div className="epm-header">
          <div className="epm-header-left">
            <img
              src={`${process.env.PUBLIC_URL}/images/bhima_logo3.png`}
              alt="Bhima"
              className="epm-brand-logo"
            />
            <div className="epm-header-titles">
              <h2>
                <i className="bi bi-file-earmark-text"></i> Enrollment Preview
              </h2>
              <p>Please review all entered details and documents before final save</p>
            </div>
          </div>
          <div className="epm-header-right">
            {branch && (
              <span className="epm-badge-country">
                Branch: {branch}
              </span>
            )}
            <span className="epm-badge-country">
              {isSingapore ? "🇸🇬 Singapore" : "🇮🇳 India"}
            </span>
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
        </div>

        {/* ─── Scrollable Body ─── */}
        <div className="epm-body">
          {/* Hero Profile Card */}
          <div className="epm-hero-card">
            <div className="epm-avatar-wrap">
              {image ? (
                <>
                  <img
                    src={image}
                    alt="Customer Photo"
                    className="epm-avatar-img"
                    onClick={() => handleOpenLightbox(image, "Customer Photo")}
                    style={{ cursor: "pointer" }}
                    title="Click to zoom photo"
                  />
                  <span className="epm-avatar-badge" title="Photo Captured">
                    <i className="bi bi-check"></i>
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
              <h3 className="epm-hero-name">
                {subscriberData.subscriberName || "Subscriber Name"}
              </h3>
              <div className="epm-hero-meta">
                {subscriberData.mobileNo && (
                  <span>
                    <i className="bi bi-phone"></i>
                    {isSingapore ? "+65 " : "+91 "}
                    {subscriberData.mobileNo}
                  </span>
                )}
                {subscriberData.email && (
                  <span>
                    <i className="bi bi-envelope"></i>
                    {subscriberData.email}
                  </span>
                )}
                {subscriberData.gender && (
                  <span>
                    <i className="bi bi-gender-ambiguous"></i>
                    {subscriberData.gender}
                  </span>
                )}
                {subscriberData.dob && (
                  <span>
                    <i className="bi bi-calendar-event"></i>
                    DOB: {subscriberData.dob}
                  </span>
                )}
              </div>

              <div className="epm-hero-scheme-tag">
                <span>Selected Scheme:</span>
                <strong>{membershipData.selectedSchemeName || "—"}</strong>
                {membershipData.installmentAmount && (
                  <>
                    <span>•</span>
                    <strong>{formatCurrency(membershipData.installmentAmount, activeSymbol)} / Month</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Subscriber Details */}
          <div className="epm-section">
            <div className="epm-section-header">
              <h4 className="epm-section-title">
                <i className="bi bi-person-lines-fill"></i> Personal & Subscriber Details
              </h4>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("subscriber-header")}
              >
                <i className="bi bi-pencil"></i> Edit
              </button>
            </div>
            <div className="epm-section-body">
              <div className="epm-grid">
                <div className="epm-item">
                  <span className="epm-label">Subscriber Full Name</span>
                  <span className="epm-val">{subscriberData.subscriberName || "—"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Gender</span>
                  <span className="epm-val">{subscriberData.gender || "—"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Date of Birth & Age</span>
                  <span className="epm-val">
                    {subscriberData.dob || "—"} {subscriberData.age ? `(${subscriberData.age} Yrs)` : ""}
                  </span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Mobile Number</span>
                  <span className="epm-val">
                    {subscriberData.mobileNo ? `${isSingapore ? "+65 " : "+91 "}${subscriberData.mobileNo}` : "—"}
                  </span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Email Address</span>
                  <span className="epm-val">{subscriberData.email || "—"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">
                    {subscriberData.relationType ? `${subscriberData.relationType}'s Name` : "Father / Spouse Name"}
                  </span>
                  <span className="epm-val">{subscriberData.fatherName || "—"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Marital Status</span>
                  <span className="epm-val">
                    {subscriberData.maritalStatus || "—"}
                    {subscriberData.anniversaryDate ? ` (Anniversary: ${subscriberData.anniversaryDate})` : ""}
                  </span>
                </div>
                <div className="epm-item epm-grid-full">
                  <span className="epm-label">Full Residential Address</span>
                  <span className="epm-val">{fullAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Scheme & Membership Details */}
          <div className="epm-section">
            <div className="epm-section-header">
              <h4 className="epm-section-title">
                <i className="bi bi-gem"></i> Scheme & Membership Details
              </h4>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("membership-header")}
              >
                <i className="bi bi-pencil"></i> Edit
              </button>
            </div>
            <div className="epm-section-body">
              <div className="epm-scheme-banner">
                <div className="epm-scheme-stat">
                  <span className="epm-stat-label">Scheme Name</span>
                  <span className="epm-stat-val primary">{membershipData.selectedSchemeName || "—"}</span>
                </div>
                <div className="epm-scheme-stat">
                  <span className="epm-stat-label">Monthly Installment</span>
                  <span className="epm-stat-val primary">
                    {formatCurrency(membershipData.installmentAmount || 0, activeSymbol)}
                  </span>
                </div>
                <div className="epm-scheme-stat">
                  <span className="epm-stat-label">Tenure</span>
                  <span className="epm-stat-val">
                    {membershipData.noOfInstallments || 11} Months
                  </span>
                </div>
                <div className="epm-scheme-stat">
                  <span className="epm-stat-label">Expected Maturity</span>
                  <span className="epm-stat-val">
                    {membershipData.maturityDate || "—"}
                  </span>
                </div>
              </div>

              <div className="epm-grid">
                <div className="epm-item">
                  <span className="epm-label">Scheme Code</span>
                  <span className="epm-val">{membershipData.selectedSchemeCode || "—"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Scheme Type</span>
                  <span className="epm-val">{membershipData.schemeType || "Value Scheme"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Start Date</span>
                  <span className="epm-val">{membershipData.startDate || new Date().toISOString().split("T")[0]}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Branch</span>
                  <span className="epm-val">{branch || membershipData.branch || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Nominee Details */}
          <div className="epm-section">
            <div className="epm-section-header">
              <h4 className="epm-section-title">
                <i className="bi bi-people-fill"></i> Nominee Details
              </h4>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("nominee-header")}
              >
                <i className="bi bi-pencil"></i> Edit
              </button>
            </div>
            <div className="epm-section-body">
              <div className="epm-grid">
                <div className="epm-item">
                  <span className="epm-label">Nominee Name</span>
                  <span className="epm-val">{nomineeData.nomineename || "—"}</span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Relationship</span>
                  <span className="epm-val">
                    {nomineeData.relationshipName || nomineeData.relationship || "—"}
                  </span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Nominee Mobile</span>
                  <span className="epm-val">
                    {nomineeData.nomineephoneno ? `${isSingapore ? "+65 " : "+91 "}${nomineeData.nomineephoneno}` : "—"}
                  </span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">Nominee Address</span>
                  <span className="epm-val">{nomineeData.nomineeaddress || "Same as Subscriber"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Guardian Details (if minor) */}
          {(showGuardianDetails || guardaianData.guardname) && (
            <div className="epm-section">
              <div className="epm-section-header">
                <h4 className="epm-section-title">
                  <i className="bi bi-shield-check"></i> Guardian Details (for Minor)
                </h4>
                <button
                  type="button"
                  className="epm-btn-edit-sec"
                  onClick={() => onEditSection && onEditSection("guardian-header")}
                >
                  <i className="bi bi-pencil"></i> Edit
                </button>
              </div>
              <div className="epm-section-body">
                <div className="epm-grid">
                  <div className="epm-item">
                    <span className="epm-label">Guardian Name</span>
                    <span className="epm-val">{guardaianData.guardname || "—"}</span>
                  </div>
                  <div className="epm-item">
                    <span className="epm-label">Relationship to Nominee</span>
                    <span className="epm-val">
                      {guardaianData.guardrelationshipName || guardaianData.guardrelationship || "—"}
                    </span>
                  </div>
                  <div className="epm-item">
                    <span className="epm-label">Guardian Gender</span>
                    <span className="epm-val">{guardaianData.guardGender || "—"}</span>
                  </div>
                  <div className="epm-item">
                    <span className="epm-label">Guardian DOB</span>
                    <span className="epm-val">{guardaianData.guarddob || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Identity & Uploaded Documents */}
          <div className="epm-section">
            <div className="epm-section-header">
              <h4 className="epm-section-title">
                <i className="bi bi-card-image"></i> Identity & Uploaded Documents
              </h4>
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
                          <span style={{ fontSize: "11px", color: "#8c5c34", fontWeight: "600" }}>
                            Doc #{idx + 1}
                          </span>
                        </div>

                        <div className="epm-doc-number-row">
                          <span>Doc Number:</span>
                          <span className="doc-id-pill">{docNumber}</span>
                        </div>

                        <div
                          className="epm-doc-preview-box"
                          onClick={() => handleOpenLightbox(docImage, `${docName} (${docNumber})`)}
                          title="Click to view full image"
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
                              <i className="bi bi-file-earmark-arrow-up fs-2"></i>
                              <span>Document on record</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="epm-no-docs">
                  <i className="bi bi-info-circle me-2"></i>
                  No documents uploaded. (Identity documents are optional for Singapore enrollments under threshold)
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Photo & Digital Signature */}
          <div className="epm-section">
            <div className="epm-section-header">
              <h4 className="epm-section-title">
                <i className="bi bi-shield-lock-fill"></i> Photo & Customer Signature Proof
              </h4>
              <button
                type="button"
                className="epm-btn-edit-sec"
                onClick={() => onEditSection && onEditSection("camera-header")}
              >
                <i className="bi bi-pencil"></i> Edit Photo
              </button>
            </div>
            <div className="epm-section-body">
              <div className="epm-proofs-grid">
                <div className="epm-proof-card">
                  <span className="epm-proof-title">
                    <i className="bi bi-camera me-1"></i> Customer Photo
                  </span>
                  {image ? (
                    <img
                      src={image}
                      alt="Customer Camera Capture"
                      className="epm-proof-img"
                      onClick={() => handleOpenLightbox(image, "Customer Photo")}
                      style={{ cursor: "pointer" }}
                      title="Click to zoom"
                    />
                  ) : (
                    <span style={{ fontSize: "12px", color: "#8c5c34" }}>No photo captured</span>
                  )}
                </div>

                <div className="epm-proof-card">
                  <span className="epm-proof-title">
                    <i className="bi bi-pen me-1"></i> Customer Signature
                  </span>
                  {ekycSignature ? (
                    <img
                      src={ekycSignature}
                      alt="Customer Signature"
                      className="epm-proof-img"
                      onClick={() => handleOpenLightbox(ekycSignature, "Customer Signature")}
                      style={{ cursor: "pointer" }}
                      title="Click to zoom"
                    />
                  ) : (
                    <span style={{ fontSize: "12px", color: "#8c5c34" }}>
                      Digital signature will be captured / confirmed on save
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Payment Details & Terms */}
          <div className="epm-section">
            <div className="epm-section-header">
              <h4 className="epm-section-title">
                <i className="bi bi-credit-card-2-front-fill"></i> Payment Mode & Terms
              </h4>
            </div>
            <div className="epm-section-body">
              <div className="epm-grid">
                <div className="epm-item">
                  <span className="epm-label">Payment Mode</span>
                  <span className="epm-val" style={{ textTransform: "capitalize", fontWeight: "700" }}>
                    {paymentMode === "online" ? "💳 Online Payment" : "🏬 Offline Payment (Store Visit)"}
                  </span>
                </div>
                <div className="epm-item">
                  <span className="epm-label">First Installment Payable</span>
                  <span className="epm-val epm-val-highlight">
                    {formatCurrency(membershipData.installmentAmount || 0, activeSymbol)}
                  </span>
                </div>
                <div className="epm-item epm-grid-full">
                  <span className="epm-label">Terms & Conditions</span>
                  <span className="epm-val" style={{ color: "#28a745" }}>
                    <i className="bi bi-check-circle-fill me-1"></i> Terms & Conditions accepted and verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Sticky Footer Action Bar ─── */}
        <div className="epm-footer">
          <div className="epm-footer-left">
            <button
              type="button"
              className="epm-btn-edit"
              onClick={() => onEditSection && onEditSection("subscriber-header")}
              title="Return to form to edit details"
            >
              <i className="bi bi-pencil-square"></i>
              Edit Details
            </button>
          </div>

          <div className="epm-footer-right">
            <button
              type="button"
              className="epm-btn-save"
              disabled={isSaving}
              onClick={onConfirmSave}
              title="Confirm details and save enrollment"
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Saving Enrollment...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle fs-5"></i>
                  Confirm & Save Enrollment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Image Zoom Lightbox ─── */}
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
