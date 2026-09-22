import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, Form, Button, Alert, Table, Row, Col, Image } from "react-bootstrap";
import useSWR from "swr";
import axios from "axios";
import { Drafttabledb, COLLECTION_API, getCollectionApiUrl } from "../../apiurl";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../utlis/currencyUtils";
import { IoCloseCircleOutline } from "react-icons/io5";
// Fetcher function
const fetcher = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const UploadDocument = ({ amount, noOfInstallments, schemename, onFileUpload, uploadedDocs, onEkyc, aadharverified }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docNumberError, setDocNumberError] = useState("");
  const [message, setMessage] = useState("");
  const [popupImage, setPopupImage] = useState(null);

  const fileInputRef = useRef(null);
  const { selectedCustomerID, currencySymbol, selectedCountry } = useSelector((state) => state.customer || {});
  const activeSymbol = currencySymbol || "₹";
  const isSingapore = selectedCountry === "Singapore";
  const collectionApi = getCollectionApiUrl(selectedCountry);

  const isMobile = window.innerWidth < 768;

  const insAmt = Number(amount || 0);
  const PAN_THRESHOLD = 143000;
  const isHighValue = insAmt >= PAN_THRESHOLD;
  const hasPanUploaded = (uploadedDocs || []).some((doc) => doc.Type === "PAN" || doc.Type === "NRIC");
  const isPanRequiredManually = isHighValue && !hasPanUploaded && !isSingapore;

  const { data: sgDocList } = useSWR(
    isSingapore ? `${collectionApi}/doclist?country=SG` : null,
    fetcher
  );

  const documentTypes = useMemo(() => {
    const typeCodeMap = {
      24: ["SOD", "NEF"],
      25: ["NRIC", "PAN"],
      26: ["DRI"],
      27: ["FIN", "VOT"],
      28: ["PAS"],
      29: ["AAD"],
      30: ["OTH", "IMG"],
      31: ["ADB"],
    };

    if (isSingapore && Array.isArray(sgDocList) && sgDocList.length > 0) {
      return sgDocList.map((item) => {
        const itemId = Number(item.id ?? item.ID ?? item.DocumentID ?? item.documentTypeId);
        return {
          id: itemId,
          name: item.LovName || item.lovName || item.name || item.Name,
          typeCode: typeCodeMap[itemId] || [String(itemId)],
        };
      });
    }

    if (isSingapore) {
      return [
        { id: 24, name: "Scheme Opening Document", typeCode: ["SOD", "NEF"] },
        { id: 25, name: "NRIC Card", typeCode: ["NRIC", "PAN"] },
        { id: 26, name: "Driving License", typeCode: ["DRI"] },
        { id: 27, name: "E-Pass(FIN Number)", typeCode: ["FIN", "VOT"] },
        { id: 28, name: "Passport", typeCode: ["PAS"] },
        { id: 29, name: "Aadhar Card", typeCode: ["AAD"] },
        { id: 30, name: "Others", typeCode: ["OTH", "IMG"] },
        { id: 31, name: "Aadhar Back", typeCode: ["ADB"] },
      ];
    }

    return [
      { id: 24, name: "Scheme Opening Document", typeCode: ["SOD", "NEF"] },
      { id: 25, name: "PAN Card", typeCode: ["PAN"] },
      { id: 26, name: "Driving License", typeCode: ["DRI"] },
      { id: 27, name: "Voter ID Card", typeCode: ["VOT"] },
      { id: 28, name: "Passport", typeCode: ["PAS"] },
      { id: 29, name: "Aadhar Card", typeCode: ["AAD"] },
      { id: 30, name: "Profile Image", typeCode: ["IMG", "OTH"] },
      { id: 31, name: "Aadhar Back", typeCode: ["ADB"] },
    ];
  }, [isSingapore, sgDocList]);

  const documentConfig = useMemo(() => ({
    24: {
      pattern: /^.+$/,
      maxLength: 30,
      errorMessage: 'Please enter valid document details.',
      type: 'SOD',
    },
    25: isSingapore ? {
      pattern: /^[STFGM][0-9]{7}[A-Z]$/i,
      maxLength: 9,
      errorMessage: 'Please enter a valid NRIC number (e.g., "S1234567A").',
      type: 'NRIC',
    } : {
      pattern: /^(?!.*\s)[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      maxLength: 10,
      errorMessage: 'Please enter a valid PAN number (e.g., "ABCDE1234F").',
      type: 'PAN',
    },
    26: {
      pattern: /^[A-Z0-9]{5,15}$/i,
      maxLength: 15,
      errorMessage: 'Please enter a valid Driving License number.',
      type: 'DRI',
    },
    27: isSingapore ? {
      pattern: /^[FGM][0-9]{7}[A-Z]$/i,
      maxLength: 9,
      errorMessage: 'Please enter a valid FIN number (e.g., "F1234567A").',
      type: 'FIN',
    } : {
      pattern: /^[A-Z]{3}[0-9]{7}$/,
      maxLength: 10,
      errorMessage: 'Please enter a valid Voter ID number (e.g., "XYZ1234567").',
      type: 'VOT',
    },
    28: {
      pattern: /^[A-Z0-9]{6,12}$/i,
      maxLength: 12,
      errorMessage: 'Please enter a valid Passport number.',
      type: 'PAS',
    },
    29: {
      pattern: /^[0-9]{12}$/,
      maxLength: 12,
      errorMessage: 'Please enter a valid 12-digit Aadhaar number (e.g., "123456789012").',
      type: 'AAD',
    },
    30: {
      pattern: /^.+$/,
      maxLength: 30,
      errorMessage: 'Please enter valid document details.',
      type: 'OTH',
    },
    31: {
      pattern: /^[0-9]{12}$/,
      maxLength: 12,
      errorMessage: 'Please enter a valid 12-digit Aadhaar number.',
      type: 'ADB',
    },
  }), [isSingapore]);

  const verifyDocObj = useMemo(() => ({
    SOD: 24,
    NEF: 24,
    PAN: 25,
    NRIC: 25,
    DRI: 26,
    VOT: 27,
    FIN: 27,
    PAS: 28,
    AAD: 29,
    IMG: 30,
    OTH: 30,
    ADB: 31,
  }), []);

  const getMembershipNumber = () => {
    return selectedCustomerID?.MembershipNo || "000000";
  };

  const existingTypes = useMemo(() => {
    return uploadedDocs
      ?.filter(doc => !(doc.Type?.startsWith("SOD") || doc.Type?.startsWith("NEF")))
      ?.map(doc => {
        const found = documentTypes.find(d => d.typeCode.includes(doc.Type));
        return found?.name || doc.Type;
      }) || [];
  }, [uploadedDocs]);

  const availableTypes = useMemo(() => {
    const excludedNames = ["Profile Image", "Scheme Opening Document"];

    return documentTypes.filter((doc) => {
      if (excludedNames.includes(doc.name)) return false;

      // Exclude if the same document type is already uploaded
      return !uploadedDocs.some((uploaded) => {
        const uploadedTypeName = documentTypes.find(d => d.typeCode.includes(uploaded.Type))?.name;
        return uploadedTypeName === doc.name;
      });
    });
  }, [uploadedDocs]);

  const getDocTypeName = (doc, fallbackTypeId) => {
    let type = "";
    let typeId = 0;
    let docNo = "";

    if (typeof doc === "object" && doc !== null) {
      type = String(doc.Type || doc.type || "").trim();
      typeId = Number(doc.documentTypeId || doc.DocumentTypeID || fallbackTypeId || 0);
      docNo = String(doc.Number || doc.number || doc.documentNo || doc.DocumentNo || doc.docNumber || doc.Name || doc.DocumentDescription || "").trim();
    } else {
      type = String(doc || "").trim();
      typeId = Number(fallbackTypeId || 0);
    }

    const upperType = type.toUpperCase();

    if (upperType === "PAN") {
      // If docNo matches Singapore NRIC/FIN format (starts with S, T, F, G, M followed by 7 digits and a letter)
      if (/^[STFGM][0-9]{7}[A-Z]$/i.test(docNo)) {
        return "NRIC Card";
      }
      // If docNo matches Indian PAN format (5 letters, 4 digits, 1 letter)
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(docNo)) {
        return "PAN Card";
      }
      return isSingapore ? "NRIC Card" : "PAN Card";
    }

    if (upperType === "NRIC") return "NRIC Card";
    if (upperType === "SOD" || upperType === "NEF" || typeId === 24) return "Scheme Opening Document";
    if (upperType === "AAD" || upperType === "AADHAR" || upperType === "AADHAAR" || typeId === 29) return "Aadhaar Card";
    if (upperType === "ADB" || typeId === 31) return "Aadhar Back";
    if (upperType === "DRI" || typeId === 26) return "Driving License";
    if (upperType === "FIN") return "E-Pass (FIN Number)";
    if (upperType === "VOT" || (typeId === 27 && !isSingapore)) return "Voter ID Card";
    if (typeId === 27 && isSingapore) return "E-Pass (FIN Number)";
    if (upperType === "PAS" || typeId === 28) return "Passport";
    if (upperType === "OTH" || (typeId === 30 && isSingapore)) return "Others";
    if (upperType === "IMG" || typeId === 30) return "Profile Image";

    const found = documentTypes.find(d => 
      (Array.isArray(d.typeCode) && d.typeCode.some(tc => tc.toUpperCase() === upperType)) || 
      d.id === typeId || 
      String(d.id) === type
    );
    if (found) return found.name;

    return type || "Document";
  };

  const displayDocs = useMemo(() => {
    if (!Array.isArray(uploadedDocs)) return [];
    const filtered = uploadedDocs.filter(doc => {
      const t = String(doc.Type || doc.type || "").toUpperCase();
      const tid = Number(doc.documentTypeId || doc.DocumentTypeID || 0);
      return !(t.startsWith("NEF") || t.startsWith("SOD") || t === "IMG" || tid === 30);
    });
    const uniqueDocs = [];
    const seen = new Set();

    filtered.forEach(doc => {
      const docNum = String(
        doc.Number ||
        doc.number ||
        doc.documentNo ||
        doc.DocumentNo ||
        doc.docNumber ||
        doc.DocNumber ||
        doc.Name ||
        doc.name ||
        doc.DocumentDescription ||
        ""
      ).trim();
      const img = String(
        doc.ImagePath ||
        doc.imagePath ||
        doc.ImageURL ||
        doc.imageURL ||
        doc.ImageUrl ||
        doc.imageUrl ||
        ""
      ).trim();
      const key = `${doc.Type || doc.type || doc.documentTypeId}_${docNum || img}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDocs.push(doc);
      }
    });
    return uniqueDocs;
  }, [uploadedDocs]);

  const validateDocNumber = (docTypeId, docNumber) => {
    const config = documentConfig[docTypeId];
    if (!config) return null;
    return config.pattern.test(docNumber.trim()) ? null : config.errorMessage;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(selectedFile.type.startsWith("image/") ? URL.createObjectURL(selectedFile) : "");
      setMessage("");
    }
  };

  const handleDocTypeChange = (e) => {
    setDocType(e.target.value);
    setDocNumber("");
    setDocNumberError("");
    setMessage("");
  };

  const handleDocNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    const maxLength = docType && documentConfig[docType]?.maxLength;
    if (!maxLength || value.length <= maxLength) {
      setDocNumber(value);
      const error = validateDocNumber(docType, value);
      setDocNumberError(error);
    }
    setMessage("");
  };

  const handleUpload = () => {
    if (!docType || !docNumber || !file) {
      setMessage("All fields are required.");
      return;
    }

    const error = validateDocNumber(docType, docNumber);
    if (error) {
      setDocNumberError(error);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const mimeType = file.type;
      const base64String = reader.result.split(",")[1];
      if (!base64String) {
        setMessage("Base64 conversion failed.");
        return;
      }

      const documentData = `data:${mimeType};base64,${base64String}`;
      const selectedDoc = documentTypes.find(d => d.id == docType);
      let typeCode = selectedDoc?.typeCode[0];

      if (typeCode === "NEF") {
        typeCode = `NEF${getMembershipNumber()}`;
      }

      onFileUpload({
        file,
        documentData,
        docType: Number(docType),
        DocumentID: Number(docType),
        documentTypeId: Number(docType),
        docNumber,
        verifyDocObj,
        typeCode,
      });

      setMessage("Document uploaded successfully!");
      setFile(null);
      setPreview("");
      setDocType("");
      setDocNumber("");
    };

    reader.onerror = () => {
      setMessage("File read error.");
    };

    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    setFile(null);
    setPreview("");
    setDocType("");
    setDocNumber("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isEkycEnabled = (localStorage.getItem("EnableEkyc") || window.APP_CONFIG?.EnableEkyc || "0") === "1";

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <Card.Title className="text-center mb-0">Upload Documents</Card.Title>
            {isEkycEnabled && !isSingapore && onEkyc && aadharverified !== 1 && (
              <Button
                size="sm"
                onClick={onEkyc}
                style={{
                  background: "linear-gradient(103.45deg, #614119 -11.68%, #CD9A50 48.54%, #614119 108.76%)",
                  color: "white",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "bold",
                }}
              >
                <i className="bi bi-shield-check" style={{ fontSize: "16px" }}></i>
                Send for eKYC
              </Button>
            )}
          </div>
          {!isSingapore && aadharverified === 1 && (
            <Alert variant="success" className="mb-3">
              <i className="bi bi-check-circle-fill" style={{ marginRight: "8px" }}></i>
              eKYC verified. Documents fetched from DigiLocker.
            </Alert>
          )}

          {isPanRequiredManually && (
            <Alert variant="warning" className="mb-3" style={{ borderLeft: "5px solid #dc3545", backgroundColor: "#fff3cd", color: "#856404" }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: "8px", color: "#dc3545" }}></i>
              <strong>PAN Card Mandatory!</strong> Installment amount is {formatCurrency(insAmt, activeSymbol)} ({formatCurrency(143000, activeSymbol)} &amp; above). PAN Card is mandatory. Since PAN was not provided in eKYC, please upload your PAN Card manually below.
            </Alert>
          )}

          {(aadharverified !== 1 || isPanRequiredManually || availableTypes.length > 0) && (
            <>
              <Row className="mb-3 align-items-end upload-document-items">
                <Col md={4}>
                  {availableTypes.length === 0 ? (
                    <Alert variant="success" className="mt-2 mb-0">
                      All documents uploaded!
                    </Alert>
                  ) : (
                    <div className="selextParentBox">
                      <Form.Select value={docType} onChange={handleDocTypeChange} name="uploadd-cocument">
                        <option value="">Select Document</option>
                        {availableTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                </Col>
                <Col md={4}>
                  <Form.Control
                    type="text"
                    placeholder="Enter Document Number"
                    value={docNumber}
                    onChange={handleDocNumberChange}
                    disabled={availableTypes.length === 0}
                  />
                </Col>
                <Col md={4}>
                  <Form.Control
                    type="file"
                    ref={fileInputRef}
                    disabled={!docType || !docNumber || availableTypes.length === 0}
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                </Col>
              </Row>

              <div className="text-center">
                {preview ? (
                  <img src={preview} alt="Preview" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }} />
                ) : file?.type === "application/pdf" ? (
                  <div><i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: "30px" }}></i><p>PDF Selected</p></div>
                ) : (
                  <i className="bi bi-camera" style={{ fontSize: "40px" }}></i>
                )}
              </div>

              {file && (
                <div className="text-center mt-2">
                  <Button variant="primary" size="sm" onClick={handleUpload}>Upload</Button>{" "}
                  <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {docNumberError && <Alert variant="danger">{docNumberError}</Alert>}
      {message && (
        <Alert variant={message.includes("success") ? "success" : "danger"}>
          {message}
        </Alert>
      )}

      <h5 className="mt-4">Uploaded Documents</h5>
      <div className="sm-table"> <Table striped bordered hover>
        <thead>
          <tr>
            <th>Sl. No.</th>
            <th>Doc Type</th>
            <th>Doc No.</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {displayDocs.length > 0 ? (
            displayDocs.map((doc, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{getDocTypeName(doc, doc.documentTypeId)}</td>
                <td>{doc.Number || doc.number || doc.documentNo || doc.DocumentNo || doc.docNumber || doc.DocNumber || doc.Name || doc.name || doc.DocumentDescription || doc.DocumentDecription || "-"}</td>
                <td>
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      let imgSrc = doc.ImagePath || doc.imagePath || doc.ImageURL || doc.imageURL || doc.ImageUrl || doc.imageUrl;
                      if (!imgSrc) {
                        const upperType = String(doc.Type || doc.type || "").toUpperCase();
                        if (aadharverified === 1 && (upperType.includes("AAD") || doc.documentTypeId === 29)) {
                          imgSrc = "/images/aadhardummy.png";
                        } else if (aadharverified === 1 && (upperType.includes("PAN") || upperType.includes("NRIC") || doc.documentTypeId === 25)) {
                          imgSrc = "/images/pandummy.png";
                        }
                      }
                      if (imgSrc) {
                        setPopupImage(imgSrc);
                      }
                    }}
                  >
                    <i className="bi bi-eye"></i>
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">No documents uploaded.</td>
            </tr>
          )}
        </tbody>
      </Table></div>

      {popupImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setPopupImage(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              ...(isMobile
                ? { width: "90vw" }   // mobile responsive
                : { width: "90vh" }  // desktop responsive             ///////////////// Mohith_dev///////////
              ),
              maxWidth: "1200px", // optional: prevent over-large containers on wide screens
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#333",
              }}
              onClick={() => setPopupImage(null)}
            >
              <IoCloseCircleOutline  color="brown" size={30} />
            </button>
            <img
              src={popupImage}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "100%",
                height: "100%",
                objectFit: "contain", 
                         
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDocument;