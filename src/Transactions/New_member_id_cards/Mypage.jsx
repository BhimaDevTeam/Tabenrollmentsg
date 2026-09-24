import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import {
  Container,
  CssBaseline,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Modal,
  Fade,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Membershipdetails from "./MembershipDetails";
import Subscriberdetails from "./SubscriberDetails";
import Nomineedeatils from "./NomineeDeatils";
import Paymentdetails from "./PaymentDetails";
import GuardaianDetails from "./GuardaianDetails";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Mypage.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { calculateAge } from "../PickDate/DateUtils";

import CameraIcon from '@mui/icons-material/Camera';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCustomerID } from "../../redux/customer/customerSlice";
import { Drafttabledb, getCollectionApiUrl, SG_CUSTOMER_DATA_CREATE_API, SG_SEARCH_CUSTOMER_API } from "../../apiurl";
import { formatCurrency } from "../../utlis/currencyUtils";
import WebCamComponent from "./WebCamComponent";
import UploadDocument from "./UploadFile";
import EkycQRModal from "./EkycQRModal";

import Paymentgateway from "./Paymentgateway";
import Header from "../../header";

// Document ID mapping based on database LovName:
// 24: Scheme Opening Document
// 25: NRIC Card
// 26: Driving License
// 27: E-Pass(FIN Number)
// 28: Passport
// 29: Aadhar Card
// 30: Others
// 31: Aadhar Back
const resolveDocumentId = (doc) => {
  if (!doc) return 30;
  const directId = Number(doc.DocumentID ?? doc.documentTypeId ?? doc.DocumentTypeID ?? doc.docType ?? doc.id ?? doc.ID);
  if (directId && [24, 25, 26, 27, 28, 29, 30, 31].includes(directId)) {
    return directId;
  }
  const rawType = String(doc.Type || doc.type || doc.name || doc.Name || doc.LovName || doc.lovName || "").toUpperCase().trim();
  if (rawType.includes("SCHEME") || rawType === "SOD" || rawType === "NEF") return 24;
  if (rawType.includes("NRIC") || rawType === "PAN" || rawType.includes("PAN CARD")) return 25;
  if (rawType.includes("DRIV") || rawType.includes("LICEN") || rawType === "DRI" || rawType === "DL") return 26;
  if (rawType.includes("E-PASS") || rawType.includes("FIN") || rawType.includes("VOTER") || rawType === "VOT") return 27;
  if (rawType.includes("PASS") || rawType === "PAS") return 28;
  if (rawType.includes("BACK") || rawType === "ADB") return 31;
  if (rawType.includes("AAD") || rawType.includes("UID")) return 29;
  if (rawType.includes("IMG") || rawType.includes("PHOTO") || rawType.includes("IMAGE") || rawType.includes("OTHER") || rawType === "OTH") return 30;

  if (directId && !isNaN(directId) && directId > 0) return directId;
  return 30;
};

// import { ErrorSharp } from '@mui/icons-material';
const Mypage = () => {
  const dispatch = useDispatch();
  const { selectedCustomerID, selectedCountry, currencySymbol } = useSelector((state) => state.customer || {});
  const activeSymbol = currencySymbol || (selectedCountry === "Singapore" ? "S$" : "₹");
  console.log("selectedCustomerID",selectedCustomerID)

  const location = useLocation();
  const navigate = useNavigate();
  const {
    customerData,
    phoneNo,
    email: passedEmail,
    loginMethod,
    branch,
    selectedId,
    selectedOption,
    newSubscriber: initialSubscriber,
    aadharverified: initialAadharVerified,
    aadharNo: initialAadharNo,
    selectedScheme: initialSelectedScheme
  } =
    location.state && typeof location.state === "object" ? location.state : {};

  const effectiveEmail =
    passedEmail ||
    (phoneNo && phoneNo.includes("@") ? phoneNo : "") ||
    (typeof window !== "undefined" ? localStorage.getItem("customerEmail") || "" : "") ||
    "";

  const isBase64 = (str) => {
    if (!str || typeof str !== "string") return false;
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  };

  const getCleanBranch = (val) => {
    const raw = val || localStorage.getItem("decodedBranch") || "";
    if (!raw) return "";
    let decoded = raw;
    if (isBase64(raw)) {
      try {
        decoded = decodeURIComponent(atob(raw));
      } catch (e) {
        decoded = raw;
      }
    }
    if (decoded && decoded.toUpperCase().trim() === "LN") {
      return "LI";
    }
    return decoded;
  };

  const [newSubscriber, setNewSubscriber] = useState(initialSubscriber || null);
  const [aadharverified, setAadharverified] = useState(initialAadharVerified || 0);
  const [aadharNo, setAadharNo] = useState(initialAadharNo || "");

  const [expanded, setExpanded] = useState("subscriber-header");
  const [subscriberData, setSubscriberData] = useState({});
  const [phone, setPhone] = useState(phoneNo || "");
  const [membershipData, setMembershipData] = useState({});
  const [nomineeData, setNomineeData] = useState({});
  const [bankData, setBankData] = useState({});
  const [guardaianData, setGuardianData] = useState({});
  const [showGuardianDetails, setShowGuardianDetails] = useState(false);
  const [saveDraftTrigger, setSaveDraftTrigger] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [image, setImage] = useState("");
  const [openofflineModal, setopenofflineModal] = useState(false);
  const [IsDisabledCheck, setIsDisabledCheck] = useState({});
  const [errorValidate, seterrorValidate] = useState({});

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState(selectedCustomerID.Documents || []);

  const [paymentmode, setpaymentmode] = useState("");
  const [draftIDData,setdraftIDData]= useState("")
  const [isSaving, setIsSaving] = useState(false);
  const [IsDisabledall, setIsDisabledall] = useState(false);
  const [alldocs, setAllDocs] = useState([]);// ALL FILES WILL BE STORED HERE IN ARRAY

  // eKYC QR modal state
  const [ekycQROpen, setEkycQROpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [noOfInstallments, setNoOfInstallments] = useState(11);
  const [ekycSignature, setEkycSignature] = useState(null); // signature captured on eKYC page
  const [permanentAddress, setPermanentAddress] = useState("");

  // Handle eKYC completion from QR modal - update state in-place without navigating
  const handleEkycComplete = useCallback((ekycData) => {
    console.log("handleEkycComplete received:", { hasPhoto: !!ekycData.aadhaarPhoto, photoLength: ekycData.aadhaarPhoto?.length, aadharNo: ekycData.aadharNo, hasSignature: !!ekycData.ekycSignature, permanentAddress: ekycData.permanentAddress });
    setAadharverified(ekycData.aadharverified || 1);
    if (ekycData.newSubscriber) setNewSubscriber(ekycData.newSubscriber);
    if (ekycData.aadhaarPhoto) setImage(ekycData.aadhaarPhoto);
    if (ekycData.aadharNo) setAadharNo(ekycData.aadharNo);
    if (ekycData.ekycSignature) setEkycSignature(ekycData.ekycSignature);
    if (ekycData.permanentAddress) setPermanentAddress(ekycData.permanentAddress);
    if (ekycData.aadhaarDoc) {
      setUploadedDocs((prev) => {
        return [...prev.filter((d) => d.Type !== "AAD"), { ...ekycData.aadhaarDoc, DocumentID: 29, documentTypeId: 29, Type: "AAD" }];
      });
      setAllDocs((prev) => {
        return [...prev.filter((d) => d.documentTypeId !== 29), { DocumentID: 29, documentTypeId: 29, imagePath: ekycData.aadhaarDoc.ImagePath, documentNo: ekycData.aadhaarDoc.Name, Type: "AAD" }];
      });
    }
    if (ekycData.panDoc) {
      setUploadedDocs((prev) => {
        return [...prev.filter((d) => d.Type !== "PAN"), { ...ekycData.panDoc, DocumentID: 25, documentTypeId: 25, Type: "PAN" }];
      });
      setAllDocs((prev) => {
        return [...prev.filter((d) => d.documentTypeId !== 25), { DocumentID: 25, documentTypeId: 25, imagePath: ekycData.panDoc.ImagePath || "", documentNo: ekycData.panDoc.Name, Type: "PAN" }];
      });
    }
  }, []);

  const calculateMaturityDate = (startDateStr, noOfMonths = 11) => {
    if (!startDateStr) return "";
    try {
      const startDate = new Date(startDateStr);
      startDate.setMonth(startDate.getMonth() + noOfMonths);
      return startDate.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error calculating maturity date:", e);
      return "";
    }
  };

  useEffect(() => {
    const fetchBranchAndSchemeDetails = async () => {
      const cleanCode = getCleanBranch(branch || membershipData.branch || localStorage.getItem("decodedBranch"));
      if (!cleanCode) return;
      const apiBase = getCollectionApiUrl(selectedCountry);
      try {
        const response = await fetch(`${apiBase}/branchdetails`);
        if (response.ok) {
          const data = await response.json();
          const found = data.find(b => b.Branch_Code?.toLowerCase() === cleanCode.toLowerCase());
          if (found) {
            setBranchName(found.Branch_Name || found.BranchName || "");
          }
        }
      } catch (err) {
        console.error("Error fetching branch name:", err);
      }

      if (membershipData.selectedSchemeCode) {
        try {
          const response = await fetch(`${apiBase}/schemes?branch=${cleanCode}`);
          if (response.ok) {
            const data = await response.json();
            const match = data.find(s => s.SchemeCode === membershipData.selectedSchemeCode);
            if (match && match.NoOfIns) {
              setNoOfInstallments(match.NoOfIns);
            }
          }
        } catch (err) {
          console.error("Error fetching scheme details:", err);
        }
      }
    };
    fetchBranchAndSchemeDetails();
  }, [branch, membershipData.branch, membershipData.selectedSchemeCode]);

  const generateEnrollmentPdf = async (currentBranchCode) => {
    try {
      const panDoc = alldocs.find(d => Number(d.documentTypeId) === 25);
      let CustPanNo = panDoc ? panDoc.documentNo : "";
      if (!CustPanNo && uploadedDocs) {
        const uploadedPan = uploadedDocs.find(d => d.Type === "PAN");
        if (uploadedPan) {
          CustPanNo = uploadedPan.Name || uploadedPan.documentNo || "";
        }
      }
      
      const aadharDoc = alldocs.find(d => Number(d.documentTypeId) === 29);
      let Aadar_Number = aadharNo || (aadharDoc ? aadharDoc.documentNo : "");
      if (!Aadar_Number && uploadedDocs) {
        const uploadedAadhar = uploadedDocs.find(d => d.Type === "AAD");
        if (uploadedAadhar) {
          Aadar_Number = uploadedAadhar.Name || uploadedAadhar.documentNo || "";
        }
      }

      const cleanBranch = currentBranchCode || getCleanBranch(branch || membershipData.branch || localStorage.getItem("decodedBranch"));
      const today = new Date();
      const Start_Date = today.toISOString().split('T')[0];
      const Maturity_Date = calculateMaturityDate(Start_Date, noOfInstallments);

      // Check web.config flag: EnableSignatureEmail (0 = skip email, 1 = send). Default: enabled.
      const isSignatureEmailEnabled = (localStorage.getItem("EnableSignatureEmail") || window.APP_CONFIG?.EnableSignatureEmail || "1") === "1";

      const pdfPayload = {
        Scheme_Code: membershipData.selectedSchemeCode || "",
        Scheme_Name: membershipData.selectedSchemeName || "",
        Branch_Code: cleanBranch || "",
        Branch_Name: branchName || "",
        Salutation: subscriberData.gender === "Male" ? "Mr." : "Mrs.",
        Cust_Name: subscriberData.subscriberName || "",
        Address1: subscriberData.address1 || "",
        Address2: subscriberData.address2 || "",
        City: subscriberData.city || "",
        State: subscriberData.state || "",
        Pin_Code: subscriberData.pinCode || "",
        Mobile_No: subscriberData.mobileNo || "",
        Phone_No: phone || subscriberData.mobileNo || "",
        DateOf_Birth: subscriberData.dob || "",
        email_id: subscriberData.email || "",
        CustPanNo: CustPanNo || "",
        Aadar_Number: Aadar_Number || "",
        Gender: subscriberData.gender || "",
        Start_Date: Start_Date,
        Maturity_Date: Maturity_Date,
        InstallmentAmount: Number(membershipData.installmentAmount) || 0,
        NomineeName: nomineeData.nomineename || "",
        NomineePhone: nomineeData.nomineephoneno || "",
        NomineeAddress: nomineeData.nomineeaddress || "",
        NomineeRelation: nomineeData.relationshipName || nomineeData.relationship || "",
        GuardianName: guardaianData.guardname || "",
        MetalType: membershipData.commodityTypeId === 1 ? "Gold" : "Silver",
        SalesPersonName: "",
        AccountNo: bankData.accountNo || "",
        IFSC: bankData.ifscCode || "",
        BankName: selectedCustomerID?.BankDetails?.[0]?.BankName || "",
        // Include eKYC signature to generate pre-signed PDF (skips email sign-link step)
        ...(ekycSignature ? { SignatureBase64: ekycSignature } : {}),
        // Tell the API whether to send the signature email (controlled via web.config EnableSignatureEmail)
        sendEmail: isSignatureEmailEnabled,
      };
      const isSingaporeCall = (cleanBranch === "LI" || cleanBranch === "LN" || selectedCountry === "Singapore");
      const pdfApiBase = getCollectionApiUrl(isSingaporeCall ? "Singapore" : selectedCountry);

      console.log("Generating Enrollment PDF with payload:", {
        ...pdfPayload,
        SignatureBase64: pdfPayload.SignatureBase64 ? `[base64 ${String(pdfPayload.SignatureBase64).length} chars]` : undefined,
      });
      const response = await axios.post(
        `${pdfApiBase}/generate-enrollment-pdf-direct`,
        pdfPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "country-code": isSingaporeCall ? "singapore" : "india",
            country: isSingaporeCall ? "Singapore" : "India",
          },
          timeout: 90000,
        }
      );
      console.log("PDF generation response:", response.data);
      const sId = response.data?.SignRequestID || null;
      if (sId) {
        sessionStorage.setItem("currentSignRequestId", sId);
        if (subscriberData.mobileNo) {
          sessionStorage.setItem(`currentSignRequestId_${subscriberData.mobileNo}`, sId);
        }
      }
      return sId;
    } catch (error) {
      console.error("Error generating enrollment PDF:", error);
      return null;
    }
  };

  console.log("draftIDData",draftIDData)
  console.log("alldocs",alldocs)

  //   useEffect(()=>{
  //  if(draftIDData)
  //  {
  //     setIsDisabledall(true)
  //  }
  //  else
  //  {
  //     setIsDisabledall(false)}
  //   },[draftIDData])

  // 1. Handler function to receive the status from the child component
  const handleLinkGenerationStatus = (isGenerated) => {
    console.log("Payment link generated status in Mypage:", isGenerated);
    setIsDisabledall(isGenerated);
  };


  const handlepaymentMethod = (method) => {
    console.log("Payment method changed from", paymentmode, "to", method);
    setpaymentmode(method);

    // If switching to offline and we have an existing draft, log this for debugging
    if (method === "offline" && draftIDData) {
      console.log("Customer switching to offline payment for existing draft:", draftIDData);
    }
  };

  const [flag, setFlag] = useState({
    mobileNo: false,
    subscriberName: false,
    gender: false,
    address1: false,
    pinCode: false,
    area: false,
    city: false,
    state: false,
    email: false,
    dob: false,
  });

  //UPLOAD DOCUMENT
  const docObjTypeId = useMemo(() => {
    return {
      24: "SOD",
      25: selectedCountry === "Singapore" ? "NRIC" : "PAN",
      26: "DRI",
      27: selectedCountry === "Singapore" ? "FIN" : "VOT",
      28: "PAS",
      29: "AAD",
      30: "OTH",
      31: "ADB",
    };
  }, [selectedCountry]);


  const modalStyle = {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    borderRadius: "4px",
    border: "2px ",
    boxShadow: 24,
    p: 4,
  };
  useEffect(() => {
    // Retrieve stored data from localStorage on component load
    const storedSubscriberData =
      JSON.parse(localStorage.getItem("subscriberData")) || {};
    const storedMembershipData =
      JSON.parse(localStorage.getItem("membershipData")) || {};
    const storedNomineeData =
      JSON.parse(localStorage.getItem("nomineeData")) || {};
    const storedBankData = JSON.parse(localStorage.getItem("bankData")) || {};
    const storedGuardianData =
      JSON.parse(localStorage.getItem("guardaianData")) || {};

    // Set the retrieved data into the state
    setSubscriberData(storedSubscriberData);
    setMembershipData(storedMembershipData);
    setNomineeData(storedNomineeData);
    setBankData(storedBankData);
    setGuardianData(storedGuardianData);
  }, []);

  const validateSubscriber = () => {
    function CustomerValidation() {
      const errors = {};
      if (!subscriberData.subscriberName) {
        errors.subscriberName = "Subscriber name is required";
      }
      if (!subscriberData.gender) {
        errors.gender = "Gender is required.";
      }
      if (!subscriberData.dob) {
        errors.dob = "dob is required.";
      }
      if (!subscriberData.email) {
        errors.email = "Email ID is required.";
      } else if (!/\S+@\S+\.\S+/.test(subscriberData.email)) {
        errors.email = "Email is invalid.";
      }
      if (!subscriberData.address1.trim() && aadharverified !== 1) {
        errors.address1 = "Address is required.";
      }
      const isSingapore = selectedCountry === "Singapore";
      if (!/^\d{6}$/.test(subscriberData.pinCode)) {
        errors.pinCode = isSingapore ? "PO Code is required (6 digits)" : "Pin code is required";
      }
      if (!subscriberData.state?.length && !isSingapore) {
        errors.state = "State is required!";
      }
      if (!subscriberData.city?.length && !isSingapore) {
        errors.city = "city is required!";
      }
      if (!subscriberData.area?.length && !isSingapore) {
        errors.area = "area is required!";
      }

      seterrorValidate(errors);
      return errors;
    }

    if (
      selectedCustomerID &&
      Array.isArray(selectedCustomerID) &&
      selectedCustomerID.length > 0
    ) {
      for (let i = 0; i < selectedCustomerID.length; i++) {
        if (selectedCustomerID[i]?.Isaadharverified == 1) {
          // console.log("enter if Isaadharverified ")
          setIsDisabledCheck(subscriberData);
          return CustomerValidation();
        } else if (selectedCustomerID[i]?.customerType === "V") {
          // console.log("else if customer type v")
          // setIsDisabledCheck(subscriberData);
          return CustomerValidation();
        } else if (
          selectedCustomerID[i]?.Isaadharverified !== 1 &&
          selectedCustomerID[i]?.customerType !== "V"
        ) {
          // console.log("else  other customer  ")
          return CustomerValidation();
        }
      }
    } else if (selectedOption != "withoutAadhar") {
      return CustomerValidation();
    } else if (selectedOption == "withoutAadhar") {
      return CustomerValidation();
    }

    // new minor with old phone (subscriber)
    else if (selectedId == "minor" || selectedId == "new") {
      return CustomerValidation();
    }
  };

  const validateMembership = () => {
    const errors = {};
    const { installmentAmount, minInsValue, insMultiples } = membershipData;
    if (!membershipData.selectedSchemeCode) {
      errors.selectedSchemeCode = "Scheme is required";
    } else {
      if (!installmentAmount) {
        errors.installmentAmount = "Installment amount cannot be empty";
      } else {
        // Parse installmentAmount here to ensure we're working with numbers
        const amountInt = parseInt(Number(installmentAmount, 10));
        const minAmount = parseInt(minInsValue, 10);
        const multiple = parseInt(insMultiples, 10);

        if (isNaN(amountInt)) {
          errors.installmentAmount = "Installment amount must be an integer";
        }
        if (amountInt != null && amountInt < minAmount) {
          errors.installmentAmount = `Installment amount must be at least ${minAmount}`;
        }
        if (amountInt != null && amountInt % multiple !== 0) {
          errors.installmentAmount = `Installment amount must be a multiple of ${multiple}`;
        }
      }
    }
    seterrorValidate(errors);
    return errors;
  };
  // Membership Details Validation
  const validateNominee = () => {
    const errors = {};
    if (!nomineeData.nomineename)
      errors.nomineename = "Nominee name is required";
    if (!nomineeData.relationship)
      errors.relationship = "Nominee relationship is required";
    if (!nomineeData.nomineeaddress)
      errors.nomineeaddress = "Nominee Address is required";

    const urlParams = new URLSearchParams(window.location.search);
    const rawBranch = urlParams.get("branch") || urlParams.get("BRANCH") || branch || membershipData?.branch || localStorage.getItem("decodedBranch") || "KRM";
    const cleanBranch = String(rawBranch).toUpperCase().trim();
    const isSg = cleanBranch === "LI" || cleanBranch === "LN" || (selectedCountry === "Singapore" && cleanBranch !== "KRM");
    if (!isSg && !nomineeData.nomineephoneno) {
      errors.nomineephoneno = "Nominee Phone No is required";
    } else if (nomineeData.nomineephoneno && isSg && !/^\d{8}$/.test(nomineeData.nomineephoneno)) {
      errors.nomineephoneno = "Nominee phone must be 8 digits";
    } else if (nomineeData.nomineephoneno && !isSg && !/^\d{10}$/.test(nomineeData.nomineephoneno)) {
      errors.nomineephoneno = "Nominee phone must be 10 digits";
    }
    seterrorValidate(errors);
    return errors;
  };
  // Bank Details Validation
  const validateBank = () => {
    const errors = {};
    if (bankData.accountNo && !/^\d{9,18}$/.test(bankData.accountNo)) {
      errors.accountNo = "Valid account number is required (9 to 18 digits).";
    }
    if (bankData.ifscCode && !/^[A-Z]{4}[0-9]{7}$/.test(bankData.ifscCode)) {
      errors.ifscCode =
        "Valid IFSC code is required (4 letters followed by 7 digits).";
    }
    seterrorValidate(errors);
    return errors;
  };

  // const SetSecondElement = () => {
  //   const element = document.querySelector(`#uploaddoc-header`);
  //   if (element) {
  //     element.scrollIntoView({
  //       behavior: "smooth",
  //       block: "start",
  //     });
  //   }
  // };



  //  else if(alldocs.length===0){
  //     toast.error("Please upload all required documents")
  //     return false;
  //   }
  // Nominee Details Validation

  const validateGuardian = () => {

    const errors = {};
    if (showGuardianDetails) {
      if (!guardaianData.guardname)
        errors.guardname = "Guardian Name is required";
      if (!guardaianData.guardrelationship)
        errors.guardrelationship = "Guardian relationship is required";
      if (!guardaianData.guarddob) {
        errors.guarddob = "Guardian DOB is required";
      } else {
        const age = calculateAge(guardaianData.guarddob);
        if (age != null && age < 18) {
          errors.guarddob = "Guardian DOB should be greater than 18.";
        }
      }
      if (!guardaianData.guardGender)
        errors.guardGender = "Guardian Gender is required.";
    }
    seterrorValidate(errors);
    return errors;
  };

  const validateAllForms = () => {
    const isSingapore = selectedCountry === "Singapore";
    const errors = {
      subscriber: validateSubscriber(),
      membership: validateMembership({ ...membershipData }),
      nominee: validateNominee(),
      guardian: validateGuardian(),
      ...(!isSingapore ? { bank: validateBank() } : {}),
    };

    // Ensure we only proceed with Object.keys if errors is an object
    return Object.keys(errors).reduce((acc, key) => {
      if (errors[key] && Object.keys(errors[key]).length > 0) {
        acc[key] = errors[key];
      }
      return acc;
    }, {});
  };
  const getImageUrl = (url) => {
    setImage(url);
  };
  const handleDraft = async() => {
    //  event.preventDefault();
    // alert("1 handledraft called")
    const errors = validateAllForms();

    // const errors = validateSubscriber();
    // console.log('Submitted Errors:', errors);
    if (Object.keys(errors).length > 0) {
      if (errors.subscriber) {
        const fieldError = Object.values(errors.subscriber)[0]; // Get the first field error
        toast.error(fieldError);
        setExpanded("subscriber-header");
        seterrorValidate(errors.subscriber);
        return;
      }
      if (errors.membership) {
        const fieldError = Object.values(errors.membership)[0]; // Get the first field error
        toast.error(fieldError);
        setExpanded("membership-header");
        seterrorValidate(errors.membership);
        return;
      }
      if (errors.nominee) {
        const fieldError = Object.values(errors.nominee)[0]; // Get the first field error
        toast.error(fieldError);
        setExpanded("nominee-header");
        seterrorValidate(errors.nominee);
        return ;
      }
      if (errors.guardian) {
        const fieldError = Object.values(errors.guardian)[0]; // Get the first field error
        toast.error(fieldError);
        setExpanded("guardian-header");
        seterrorValidate(errors.guardian);
        return;
      }
      if (errors.bank) {
        const fieldError = Object.values(errors.bank)[0]; // Get the first field error
        toast.error(fieldError);
        setExpanded("bank-header");
        seterrorValidate(errors.bank);
        return;
      }
    }
    // Proceed to save draft
    // alert("before savedraft fx")
    const docs = await validatedocs();
    console.log("docs caled",docs)
    //  alert("docs present"+docs)
    if (docs) {
      // scro   llToTop()
      if (image) {
        // alert(" inside savedraft response to back withn draftid in handledraft 4 ")
        const draftvalue = await saveDraft();  // IN RESPONSE WE ILL GET DRAFTID number like 809 
        // alert("draftvalue in handledraft aftr  response from savedraft sending this payment 5",draftvalue)
        console.log("draftvalue in handledraft aftr  response from savedraft sending this payment",draftvalue)
        return draftvalue;
      } else {
        // alert("Please capture the image.");
        return false;
      }
    } else {
      return false;
    }
  };

  const selectedCustomerIDocument = selectedCustomerID.Documents ? selectedCustomerID.Documents : []
  console.log("selectedCustomerIDocument",selectedCustomerIDocument)

  useEffect(() => {
    const activeCustomer = (selectedCustomerID && Object.keys(selectedCustomerID).length > 0)
      ? selectedCustomerID
      : (Array.isArray(customerData) && customerData.length > 0 ? customerData[0] : null)
      || (() => {
        try {
          const raw = sessionStorage.getItem("selectedCustomerID");
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      })();

    if (!activeCustomer || Object.keys(activeCustomer).length === 0) {
      setUploadedDocs([]);
      setAllDocs([]);
      return;
    }

    const rawDocs = [
      ...(Array.isArray(activeCustomer.Documents) ? activeCustomer.Documents : []),
      ...(Array.isArray(activeCustomer.customerDocuments) ? activeCustomer.customerDocuments : []),
      ...(Array.isArray(activeCustomer.combinedDocuments) ? activeCustomer.combinedDocuments : []),
      ...(Array.isArray(activeCustomer.draftCustomerDocuments) ? activeCustomer.draftCustomerDocuments : []),
      ...(Array.isArray(activeCustomer.document) ? activeCustomer.document : []),
    ];

    const profileImage = activeCustomer.ImageURL || activeCustomer.ImageUrl || activeCustomer.Image;
    if (profileImage) {
      setImage((prev) => prev || profileImage);
    }

    if (rawDocs.length > 0) {
      const typeToIdMap = {
        SOD: 24,
        NEF: 24,
        PAN: 25,
        NRIC: 25,
        DRI: 26,
        DL: 26,
        FIN: 27,
        VOT: 27,
        PAS: 28,
        PASSPORT: 28,
        AAD: 29,
        AADHAR: 29,
        AADHAAR: 29,
        OTH: 30,
        OTHERS: 30,
        ADB: 31,
      };

      const typeIdToCodeMap = {
        24: "SOD",
        25: selectedCountry === "Singapore" ? "NRIC" : "PAN",
        26: "DRI",
        27: selectedCountry === "Singapore" ? "FIN" : "VOT",
        28: "PAS",
        29: "AAD",
        30: "OTH",
        31: "ADB",
      };

      const uniqueDocs = [];
      const seenKeys = new Set();

      rawDocs.forEach(doc => {
        const url = String(doc.ImageURL || doc.ImageUrl || doc.imageURL || doc.imageUrl || doc.ImagePath || doc.imagePath || doc.documentData || "").trim();
        const rawType = String(doc.Type || doc.type || doc.docType || "").trim();
        const upperType = rawType.toUpperCase();

        // If it's a profile/captured image, use it for customer photo only — do not include in documents list
        if (upperType === "IMG" || upperType === "PHOTO" || doc.Number === "IMG" || doc.number === "IMG" || doc.Name === "Profile Image" || doc.documentNo === "IMG") {
          if (url) {
            setImage((prev) => prev || url);
          }
          return;
        }

        let typeId = 0;
        if (doc.DocumentID && Number(doc.DocumentID) > 0) {
          typeId = Number(doc.DocumentID);
        } else if (doc.DocumentTypeID || doc.documentTypeId) {
          typeId = Number(doc.DocumentTypeID || doc.documentTypeId);
        } else if (typeToIdMap[upperType]) {
          typeId = typeToIdMap[upperType];
        } else if (!isNaN(rawType) && rawType !== "") {
          typeId = Number(rawType);
        } else if (upperType.includes("SCHEME")) {
          typeId = 24;
        } else if (upperType.includes("NRIC")) {
          typeId = 25;
        } else if (upperType.includes("PAN")) {
          typeId = 25;
        } else if (upperType.includes("DRI") || upperType.includes("LICEN")) {
          typeId = 26;
        } else if (upperType.includes("FIN") || upperType.includes("E-PASS")) {
          typeId = 27;
        } else if (upperType.includes("PAS")) {
          typeId = 28;
        } else if (upperType.includes("BACK") || upperType.includes("ADB")) {
          typeId = 31;
        } else if (upperType.includes("AAD")) {
          typeId = 29;
        } else if (upperType.includes("IMG") || upperType.includes("PHOTO")) {
          typeId = 30;
        } else {
          typeId = 30;
        }

        const typeCode = rawType || typeIdToCodeMap[typeId] || "Document";
        const docNo = String(
          doc.Number ||
          doc.number ||
          doc.documentNo ||
          doc.DocumentNo ||
          doc.docNumber ||
          doc.DocNumber ||
          doc.Name ||
          doc.name ||
          doc.DocumentDescription ||
          doc.DocumentDecription ||
          ""
        ).trim();

        const dedupKey = `${typeCode}_${typeId}_${docNo || url}`;
        if (!seenKeys.has(dedupKey)) {
          seenKeys.add(dedupKey);
          uniqueDocs.push({
            ...doc,
            DocumentID: typeId,
            documentTypeId: typeId,
            Type: typeCode,
            type: typeCode,
            ImagePath: url,
            ImageURL: url,
            imagePath: url,
            ImageUrl: url,
            Name: docNo,
            name: docNo,
            documentNo: docNo,
            DocumentNo: docNo,
            Number: docNo,
            number: docNo,
            DocumentDescription: docNo,
            IsVerified: Boolean(doc.IsVerified || doc.isVerified),
          });
        }
      });

      setUploadedDocs(uniqueDocs);
      setAllDocs(uniqueDocs);
    } else {
      setUploadedDocs([]);
      setAllDocs([]);
    }
  }, [selectedCustomerID, customerData]);



  //UploadedFile
  const handleFileUpload = (data) => {
    setUploadedFile(data); // Store the document data
    if (data) {
      const docId = Number(data.DocumentID || data.docType || data.documentTypeId || 0);
      const docTypeMapped = docObjTypeId[docId] || data.typeCode || (docId === 25 ? (selectedCountry === "Singapore" ? "NRIC" : "PAN") : (docId === 26 ? "DRI" : docId === 27 ? (selectedCountry === "Singapore" ? "FIN" : "VOT") : docId === 28 ? "PAS" : docId === 29 ? "AAD" : docId === 31 ? "ADB" : docId === 24 ? "SOD" : "OTH"));
      const docNo = data.docNumber;

      setAllDocs((prevDocs) => [
        ...prevDocs,
        {
          DocumentID: docId,
          documentTypeId: docId,
          imagePath: data.documentData,
          ImagePath: data.documentData,
          ImageURL: data.documentData,
          documentNo: docNo,
          Number: docNo,
          Name: docNo,
          file: data.file,
          typeCode: data.typeCode,
          Type: docTypeMapped,
        },
      ]);

      const docObj = {
        DocumentID: docId,
        documentTypeId: docId,
        Name: docNo,
        documentNo: docNo,
        Number: docNo,
        Type: docTypeMapped,
        ImagePath: data.documentData,
        ImageURL: data.documentData,
        imagePath: data.documentData,
        file: data.file,
      };

      setUploadedDocs((prev) => [...prev, docObj]);
    }
  };
  useEffect(() => {
    console.log("uploadedDocs in mypage", uploadedDocs);
  }, [uploadedDocs]);

  // console.log("checking", [
  //   ...uploadedDocs,
  //   docObj,
  //   ...selectedCustomerID.Documents,
  // ]);
  // const handleFilePanUpload = (data, pandocType) => {
  //   setPanUploadedFile(data); // Store the document data
  //   //  alert("pan")
  //   console.log("Uploaded File Data:", data); // Log the data for debugging
  // };

//   const SetFirstElement = () => {
//     const element = document.querySelector(`#subscriber-header`);
//     if (element) {
//       element.scrollIntoView({
//         behavior: "smooth",
//         block: "start",
//       });
//     }
//   };

  const dataUrlToFile = (dataUrl, filename) => {
    try {
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
      const arr = dataUrl.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename || `image_${Date.now()}.png`, { type: mime });
    } catch (err) {
      console.warn("Failed to convert dataUrl to File:", err);
      return null;
    }
  };

  const formatDateToYMD = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
      const parts = dateVal.split(/[/-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        } else if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return dateVal;
  };

  const formatCrmImageUrl = (path) => {
    if (!path || typeof path !== "string") return "";
    let trimmed = path.trim();
    // Keep camera/upload payloads as data URLs. Prefixing them builds a URL
    // longer than DraftCustomerDocuments.ImageURL and SQL rejects the insert.
    if (/^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed;
    if (trimmed.includes("http://") || trimmed.includes("https://")) {
      const idx = trimmed.lastIndexOf("http");
      return trimmed.slice(idx);
    }
    const clean = trimmed.replace(/^\/+/, "");
    if (clean.startsWith("crm/")) {
      return `https://bgstaging.bhima.gold/${clean}`;
    }
    return `https://bgstaging.bhima.gold/crm/${clean}`;
  };

  const getDocTypeName = (doc, isSg) => {
    if (doc.Type) {
      const t = String(doc.Type).trim();
      const lower = t.toLowerCase();
      if (lower === "aad" || lower === "aadhar" || lower === "aadhaar") return "aadhar";
      if (lower === "pan") return "PAN";
      if (lower === "nric") return "NRIC";
      if (lower === "dri" || lower === "driving license") return "DRI";
      if (lower === "fin") return "FIN";
      if (lower === "vot" || lower === "voter") return "VOT";
      if (lower === "pas" || lower === "passport") return "PAS";
      if (lower === "img" || lower === "photo" || lower === "profile image") return "IMG";
      return t;
    }
    const typeId = Number(doc.documentTypeId || doc.DocumentTypeID || doc.docType || 0);
    if (typeId === 25) return isSg ? "NRIC" : "PAN";
    if (typeId === 26) return "DRI";
    if (typeId === 27) return isSg ? "FIN" : "VOT";
    if (typeId === 28) return "PAS";
    if (typeId === 29) return "aadhar";
    if (typeId === 30) return "IMG";
    return isSg ? "NRIC" : "PAN";
  };

  const saveCustomerToCrm = async (overridePhoto) => {
    try {
      const cleanBranch = getCleanBranch(branch || membershipData.branch);
      const isSg = selectedCountry === "Singapore" || cleanBranch === "LI" || cleanBranch === "LN";
      const cCode = isSg ? "SG" : "IN";
      const cName = isSg ? "Singapore" : "India";

      const docList = [];
      const imageFiles = [];

      const sourceDocs = (uploadedDocs && uploadedDocs.length > 0)
        ? uploadedDocs
        : (alldocs && alldocs.length > 0)
          ? alldocs
          : (selectedCustomerID?.Documents || []);

      const seenDocNums = new Set();

      for (const d of sourceDocs) {
        const docType = getDocTypeName(d, isSg);
        if (docType === "IMG") continue; // Profile / camera photo is handled specifically below

        const docNo = (d.Number || d.documentNo || d.Name || "").trim();
        const dedupKey = `${docType}_${docNo}`;
        if (seenDocNums.has(dedupKey) && docNo) continue;
        if (docNo) seenDocNums.add(dedupKey);

        const imgPathOrData = d.ImagePath || d.imagePath || d.documentData || d.ImageURL || "";
        const isRemote = typeof imgPathOrData === "string" && (imgPathOrData.startsWith("http") || imgPathOrData.startsWith("Upload/"));

        docList.push({
          Type: docType,
          Number: docNo,
          ImagePath: isRemote ? imgPathOrData : "",
          IssueDate: null,
          ExpiryDate: null,
          IsVerified: Boolean(d.IsVerified || aadharverified === 1),
        });

        if (d.file instanceof File || d.file instanceof Blob) {
          imageFiles.push({ file: d.file, filename: `${docNo || docType}.png` });
        } else if (typeof imgPathOrData === "string" && imgPathOrData.startsWith("data:")) {
          const converted = dataUrlToFile(imgPathOrData, `${docNo || docType}.png`);
          if (converted) {
            imageFiles.push({ file: converted, filename: `${docNo || docType}.png` });
          }
        }
      }

      if (subscriberData.panNo && !seenDocNums.has(`PAN_${subscriberData.panNo.trim()}`) && !seenDocNums.has(`NRIC_${subscriberData.panNo.trim()}`)) {
        const pType = isSg ? "NRIC" : "PAN";
        docList.push({
          Type: pType,
          Number: subscriberData.panNo.trim(),
          ImagePath: "",
          IssueDate: null,
          ExpiryDate: null,
          IsVerified: false,
        });
        seenDocNums.add(`${pType}_${subscriberData.panNo.trim()}`);
      }
      if (aadharNo && !seenDocNums.has(`aadhar_${String(aadharNo).trim()}`)) {
        docList.push({
          Type: "aadhar",
          Number: String(aadharNo).trim(),
          ImagePath: "",
          IssueDate: null,
          ExpiryDate: null,
          IsVerified: Boolean(aadharverified === 1),
        });
        seenDocNums.add(`aadhar_${String(aadharNo).trim()}`);
      }

      // Handle profile image / captured webcam image as document name "IMG"
      const profilePhoto = overridePhoto || image || selectedCustomerID?.ImageURL || selectedCustomerID?.ImageUrl || selectedCustomerID?.Image;
      if (profilePhoto) {
        const isRemoteProfile = typeof profilePhoto === "string" && (profilePhoto.startsWith("http") || profilePhoto.startsWith("Upload/"));
        docList.push({
          Type: "IMG",
          Number: "IMG",
          ImagePath: isRemoteProfile ? profilePhoto : "",
          IssueDate: null,
          ExpiryDate: null,
          IsVerified: false,
        });

        if (profilePhoto instanceof File || profilePhoto instanceof Blob) {
          imageFiles.push({ file: profilePhoto, filename: "IMG.png" });
        } else if (typeof profilePhoto === "string" && profilePhoto.startsWith("data:")) {
          const converted = dataUrlToFile(profilePhoto, "IMG.png");
          if (converted) {
            imageFiles.push({ file: converted, filename: "IMG.png" });
          }
        }
      }

      const crmCustomerPayload = {
        CustomerID: selectedCustomerID?.CustomerID || null,
        MobileNo: (subscriberData.mobileNo && !subscriberData.mobileNo.includes("@") && !/[a-zA-Z]/.test(subscriberData.mobileNo))
          ? subscriberData.mobileNo
          : (phone && !phone.includes("@") && !/[a-zA-Z]/.test(phone)) ? phone : "",
        EmailID: subscriberData.email || (phone && phone.includes("@") ? phone : "") || "",
        SourceMode: subscriberData.sourceMode || selectedCustomerID?.SourceMode || "RJR",
        Name: subscriberData.subscriberName || selectedCustomerID?.Name || "",
        IsAdult: subscriberData.isMajor === "Y" || subscriberData.isMajor === true || (subscriberData.dob ? calculateAge(subscriberData.dob) >= 18 : true),
        DateOfBirth: formatDateToYMD(subscriberData.dob),
        IsMembership: false,
        Address1: subscriberData.address1 || "",
        Address2: subscriberData.address2 || "",
        City: subscriberData.city || (isSg ? "Singapore" : ""),
        State: subscriberData.state || (isSg ? "Singapore" : ""),
        District: subscriberData.district || subscriberData.city || (isSg ? "Singapore" : ""),
        CountryCode: cCode,
        CountryName: cName,
        PinCode: subscriberData.pinCode || "",
        AddressType: "HOME",
        Documents: docList,
      };

      console.log("[CRM Customerdatacreate] payload:", crmCustomerPayload);

      const formData = new FormData();
      formData.append("documents", JSON.stringify(crmCustomerPayload));

      imageFiles.forEach((item) => {
        formData.append("images", item.file, item.filename);
      });

      let crmResponse = null;
      try {
        const directRes = await fetch(SG_CUSTOMER_DATA_CREATE_API, {
          method: "POST",
          body: formData,
        });
        if (directRes.ok) {
          crmResponse = await directRes.json();
        } else {
          console.warn("[CRM Customerdatacreate] Direct fetch returned status:", directRes.status);
        }
      } catch (err) {
        console.warn("[CRM Customerdatacreate] Direct fetch failed, trying proxy:", err);
      }

      if (!crmResponse) {
        try {
          const proxyUrl = "/api/crm/api_db.js/api/Customerdatacreate";
          const proxyRes = await fetch(proxyUrl, {
            method: "POST",
            body: formData,
          });
          if (proxyRes.ok) {
            crmResponse = await proxyRes.json();
          }
        } catch (proxyErr) {
          console.warn("[CRM Customerdatacreate] Proxy fetch failed:", proxyErr);
        }
      }

      console.log("[CRM Customerdatacreate] response:", crmResponse);
      if ((crmResponse?.success || crmResponse?.status) && (crmResponse?.CustomerID || crmResponse?.CustomerDBID)) {
        const crmDocList = (crmResponse.Documents || []).map((d) => {
          const rawPath = d.ImagePath || d.imagePath || "";
          const fullUrl = formatCrmImageUrl(rawPath);
          return {
            ...d,
            ImagePath: fullUrl,
            imagePath: fullUrl,
          };
        });
        const imgDoc = crmDocList.find((d) => d.Type === "IMG" || d.Number === "IMG");
        const savedImg = crmResponse?.data?.savedFiles?.find(f => f.fieldName === "images" || f.originalName === "IMG.png");
        const newImgUrl = imgDoc?.ImagePath || savedImg?.url || (typeof profilePhoto === "string" && profilePhoto.startsWith("http") ? profilePhoto : selectedCustomerID?.ImageURL);

        dispatch(setSelectedCustomerID({
          ...(selectedCustomerID || {}),
          CustomerID: crmResponse.CustomerID || selectedCustomerID?.CustomerID,
          CustomerDBID: crmResponse.CustomerDBID || selectedCustomerID?.CustomerDBID,
          ImageURL: newImgUrl,
          Documents: crmDocList.length > 0 ? crmDocList : (selectedCustomerID?.Documents || []),
        }));
      }
      return crmResponse;
    } catch (crmError) {
      console.error("[CRM Customerdatacreate] error:", crmError);
      return null;
    }
  };

  const saveDraft = async (overrideMode) => {
    // alert("in savdraaft called 2")
    try {
      const hasIdentifier = Boolean(
        (subscriberData.mobileNo && !subscriberData.mobileNo.includes("@") && !/[a-zA-Z]/.test(subscriberData.mobileNo)) ||
        subscriberData.email ||
        (phone && phone.trim() !== "") ||
        subscriberData.subscriberName
      );
      if (!hasIdentifier) {
        navigate(`/?branch=${localStorage.getItem("encodedBranch") || btoa(localStorage.getItem("decodedBranch") || "KRM")}`);
        return;
      }
      const isSingapore = selectedCountry === "Singapore";
      if (!isSingapore && !alldocs) {
        alert("Please upload a document.");
        return;
      }
      if (!image) {
        alert("Please capture the image.");
        return;
      }

      const insAmt = Number(membershipData.installmentAmount || 0);
      const PAN_THRESHOLD = 143000;
      const hasPan = (uploadedDocs || []).some(d => d.Type === "PAN" || d.Type === "NRIC") || (alldocs || []).some(d => d.documentTypeId === 25);
      if (!isSingapore && insAmt >= PAN_THRESHOLD && !hasPan) {
        alert(`For installment amount ₹${insAmt.toLocaleString("en-IN")} (₹1,43,000 & above), PAN Card is mandatory. Please upload your PAN Card.`);
        return;
      }

      setIsSaving(true);
      setFlag(true);

      // STEP 1: Call CDP / CRM Customerdatacreate API FIRST before draft save
      let crmResponse = null;
      try {
        crmResponse = await saveCustomerToCrm();
        console.log("[SaveDraft] CRM Customerdatacreate response:", crmResponse);
        if (crmResponse?.success) {
          toast.success("Customer saved in CRM successfully");
        }
      } catch (crmErr) {
        console.warn("[SaveDraft] saveCustomerToCrm failed (continuing):", crmErr);
      }

      let add1 = subscriberData.address1 || "";
      let add2 = subscriberData.address2 || "";

      console.log("add1", add1);
      console.log("add2", add2);

      const isaadharVerified = aadharverified || 0;
      const aadhar_No = aadharNo ? aadharNo : null;
      const cleanBranch = getCleanBranch(branch || membershipData.branch);
      // Signature / enrollment PDF is not used on save.
      // let signRequestId =
      //   sessionStorage.getItem(`currentSignRequestId_${mob}`) ||
      //   sessionStorage.getItem("currentSignRequestId") ||
      //   null;
      // if (!signRequestId) {
      //   const isSignatureEmailEnabled = (localStorage.getItem("EnableSignatureEmail") || window.APP_CONFIG?.EnableSignatureEmail || "0") === "1";
      //   if (isSignatureEmailEnabled) {
      //     try {
      //       signRequestId = await generateEnrollmentPdf(cleanBranch);
      //     } catch (pdfErr) {
      //       console.warn("PDF generation failed (continuing draft save):", pdfErr);
      //       signRequestId = null;
      //     }
      //   }
      // }
      const signRequestId = null;
      let installmentAmt = Number(membershipData.installmentAmount) || 0;
      let gstAmount = 0;
      let totalAmount = installmentAmt;

      if (isSingapore && installmentAmt > 0) {
        const gstRate = Number(membershipData.gstValue) > 0 ? Number(membershipData.gstValue) : 9;
        const isInclusive = membershipData.isGSTInclusive === undefined || membershipData.isGSTInclusive === null
          ? true
          : (Number(membershipData.isGSTInclusive) === 1 || membershipData.isGSTInclusive === true);

        if (isInclusive) {
          gstAmount = (installmentAmt * gstRate) / (100 + gstRate);
          installmentAmt = installmentAmt - gstAmount; // Acc. Amount
          totalAmount = Number(membershipData.installmentAmount);
        } else {
          gstAmount = (installmentAmt * gstRate) / 100;
          totalAmount = installmentAmt + gstAmount;
        }
      }

      // STEP 2: Use Customerdatacreate ImagePath values (Upload/...) on the draft.
      // DraftEnrollment stores imagePath as-is only when it is an http URL.
      // A data URL is written as a new file and is what overflows ImageURL.
      const crmDocs = crmResponse?.Documents || crmResponse?.documents || crmResponse?.data?.Documents || [];

      const storedCrmPath = (raw) => {
        if (!raw || typeof raw !== "string") return "";
        const trimmed = raw.trim();
        if (!trimmed || /^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) return "";
        return formatCrmImageUrl(trimmed);
      };

      const isImageDoc = (d) => {
        const t = String(d.Type || d.type || "").toUpperCase().trim();
        const n = String(d.Number || d.number || d.documentNo || d.DocumentNo || "").toUpperCase().trim();
        const name = String(d.Name || d.name || "").toUpperCase().trim();
        return t === "IMG" || t === "PHOTO" || n === "IMG" || name === "PROFILE IMAGE" || name === "IMG";
      };

      const crmPathFor = (d) => {
        const type = String(d.Type || d.type || "").toUpperCase().trim();
        const num = String(d.Number || d.documentNo || d.DocumentNo || d.number || d.Name || d.name || "").trim().toUpperCase();
        const match = (Array.isArray(crmDocs) ? crmDocs : []).find((c) => {
          const cType = String(c.Type || c.type || "").toUpperCase().trim();
          const cNum = String(c.Number || c.documentNo || c.DocumentNo || c.number || "").trim().toUpperCase();
          if (num && cNum && cNum === num) return true;
          if (type && cType && cType === type && (!num || !cNum)) return true;
          return false;
        });
        return storedCrmPath(match?.ImagePath || match?.imagePath || "");
      };

      const imgDoc = (Array.isArray(crmDocs) ? crmDocs : []).find((d) => isImageDoc(d));
      const finalImageUrl = storedCrmPath(
        imgDoc?.ImagePath || imgDoc?.imagePath || imgDoc?.ImageURL || imgDoc?.imageUrl || selectedCustomerID?.ImageURL || ""
      );

      const combinedDocs = [];
      const seenDocKeys = new Set();
      // 1. Add uploadedDocs (newly uploaded documents)
      (uploadedDocs || []).forEach((d) => {
        if (isImageDoc(d)) return;
        const id = resolveDocumentId(d);
        const docNo = String(d.Number || d.documentNo || d.DocumentNo || d.Name || d.name || "").trim();
        const key = `${id}_${docNo}`;
        if (!seenDocKeys.has(key)) {
          seenDocKeys.add(key);
          combinedDocs.push(d);
        }
      });
      // 2. Add CRM docs if not already present
      (Array.isArray(crmDocs) ? crmDocs : []).forEach((d) => {
        if (isImageDoc(d)) return;
        const id = resolveDocumentId(d);
        const docNo = String(d.Number || d.documentNo || d.DocumentNo || d.Name || d.name || "").trim();
        const key = `${id}_${docNo}`;
        if (!seenDocKeys.has(key)) {
          seenDocKeys.add(key);
          combinedDocs.push(d);
        }
      });
      // 3. Add any from alldocs if not already present
      (alldocs || []).forEach((d) => {
        if (isImageDoc(d)) return;
        const id = resolveDocumentId(d);
        const docNo = String(d.Number || d.documentNo || d.DocumentNo || d.Name || d.name || "").trim();
        const key = `${id}_${docNo}`;
        if (!seenDocKeys.has(key)) {
          seenDocKeys.add(key);
          combinedDocs.push(d);
        }
      });

      const formattedDocuments = combinedDocs
        .filter((d) => !isImageDoc(d))
        .map((d) => {
          const resolvedId = resolveDocumentId(d);
          const docNo = String(d.Number || d.documentNo || d.DocumentNo || d.number || d.Name || d.name || "").trim().slice(0, 100);
          const imgPath = crmPathFor(d) || storedCrmPath(d.ImagePath || d.imagePath || d.ImageURL || d.imageUrl || "");
          const defaultType =
            resolvedId === 24 ? "SOD" :
            resolvedId === 25 ? (selectedCountry === "Singapore" ? "NRIC" : "PAN") :
            resolvedId === 26 ? "DRI" :
            resolvedId === 27 ? (selectedCountry === "Singapore" ? "FIN" : "VOT") :
            resolvedId === 28 ? "PAS" :
            resolvedId === 29 ? "AAD" :
            resolvedId === 30 ? "OTH" :
            resolvedId === 31 ? "ADB" : "OTH";
          const docType = d.Type || d.type || defaultType;

          return {
            DocumentID: resolvedId,
            documentTypeId: resolvedId,
            documentNo: docNo,
            Number: docNo,
            Type: docType,
            ImagePath: imgPath,
            imagePath: imgPath,
            IsVerified: Boolean(d.IsVerified || d.isVerified),
          };
        })
        .filter((d) => !isImageDoc(d) && d.imagePath);

      const rawMobile = (subscriberData.mobileNo || "").trim();
      const mobileForDraft =
        rawMobile &&
        !rawMobile.includes("@") &&
        !/[a-zA-Z]/.test(rawMobile) &&
        rawMobile !== "-"
          ? rawMobile.slice(0, 20)
          : "...";

      const draftData = {
        ...(Number(draftIDData) > 0 ? { DraftID: Number(draftIDData) } : {}),
        CustomerID: crmResponse?.CustomerID || selectedCustomerID?.CustomerID || "",
        CustomerDBID: crmResponse?.CustomerDBID || selectedCustomerID?.CustomerDBID || null,
        country: selectedCountry || "Singapore",
        countryCode: selectedCountry === "Singapore" ? "SG" : "IN",
        Country: selectedCountry || "Singapore",
        Branch: cleanBranch,
        Scheme: membershipData.selectedSchemeCode || "",
        Cust_Name: subscriberData.subscriberName || "",
        Gender: subscriberData.gender || "",
        Address1: add1 || "",
        Address2: add2 || "",
        Address3: subscriberData.area || "",
        PermanentAddress: permanentAddress || "",
        State: subscriberData.state || "",
        City: subscriberData.city || "", //CITY
        Pin_Code: subscriberData.pinCode || "",
        Mobile_No: mobileForDraft,
        email_id: subscriberData.email || (phone && phone.includes("@") ? phone : "") || "",
        DateOf_Birth: subscriberData.dob || "",
        InstallmentAmount: installmentAmt,
        NomineName: nomineeData.nomineename || "",
        NomineRelationship: nomineeData.relationship || "",
        NominePhone: nomineeData.nomineephoneno || "",
        NomineAddress: nomineeData.nomineeaddress || "",
        Accountno: bankData.accountNo || "",
        ifsccode: bankData.ifscCode || "",
        GuardianName: guardaianData.guardname || "",
        GuardianRelation: guardaianData.guardrelationship || "",
        Guardiangender: guardaianData.guardGender || "",
        GuardianDOB: guardaianData.guarddob || null,
        IsMembershipCreated: /^y/i.test(String(membershipData.isMembershipCreated || "")) ? "Y" : "N",
        MembershipNo: membershipData.membershipNo || "",
        IsAadarVerified: isaadharVerified,
        IsCancelFlag: "N",
        imageUrl: finalImageUrl,
        inserted_By: "BY",
        documents: formattedDocuments,
        Documents: formattedDocuments,
        TnxType: overrideMode || paymentmode,
        AadharNo: aadhar_No,
        SignRequestID: signRequestId,
        GST_Amount: gstAmount.toFixed(2),
        TotalAmount: totalAmount.toFixed(2)
      };

      console.log("Draft Data to be saved:", draftData);

      const countryName =
        selectedCountry === "Singapore" || cleanBranch === "LI" || cleanBranch === "LN"
          ? "Singapore"
          : "India";
      const countryCode = countryName === "Singapore" ? "SG" : "IN";
      const draftApiBase = getCollectionApiUrl(countryName);

      // STEP 3: Always save draft in DraftEnrollmentApi (needs DraftID)
      const response = await axios.post(
        `${draftApiBase}/draftenrollment`,
        draftData,
        {
          headers: {
            "Content-Type": "application/json",
            country: countryName,
            "country-code": countryCode,
          },
          timeout: 60000,
        }
      );
      console.log("Draft saved successfully:", response);
      if (response.data) {
        setdraftIDData(response.data.DraftID);
        console.log("response.data", response.data);

        // Not used while saving (no signature / membership creation on this step):
        // newmember-creationTE, finalize-signed-pdf, finalize-from-draft, upload-to-crm

        setIsDraftSaved(true);

        console.log("response.data.DraftID", response.data.DraftID);
        return response.data.DraftID;
      } else {
        alert("Server is Busy...plz retry");
      }
    } catch (error) {
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string" ? error.response.data.slice(0, 200) : null) ||
        error?.message ||
        "Draft save failed. Please retry.";
      alert(apiMsg);
      console.log("saveDraft error:", error?.response?.status, error?.response?.data || error);
    } finally {
      setIsSaving(false);
      setSaveDraftTrigger(false);
    }
  };

  const handlepaymentupdate = (childfunction) => {
    // alert("handle payment ,")
    childfunction();
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setopenofflineModal(false);
    clearData();
    navigate(`/?branch=${localStorage.getItem("encodedBranch") || btoa(localStorage.getItem("decodedBranch") || "KRM")}`); // Redirect to mobile page on modal close
    //  window.location.reload();
  };

  const handleModalOenOffline = () => {

    setpaymentmode("offline");
    //setOpenModal(true);
    setopenofflineModal(true);


    // clearData();
    // navigate(`/?branch=${localStorage.getItem("decodedBranch")}`); // Redirect to mobile page on modal close
    // //  window.location.reload();
  };
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDraftSaved) {
        const message =
          "Are you sure you want to leave this page? Any unsaved changes will be lost.";
        event.preventDefault();
        event.returnValue = message;
        sessionStorage.setItem("reloading", "true");
        return message;
      }
    };

    // Add the beforeunload event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup the event listener when component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDraftSaved]);

  // Redirect to /mobile if a reload was detected
  useEffect(() => {
    if (sessionStorage.getItem("reloading") === "true") {
      sessionStorage.removeItem("reloading");
      navigate(`/?branch=${localStorage.getItem("encodedBranch") || btoa(localStorage.getItem("decodedBranch") || "KRM")}`);
    }
  }, [navigate]);

  const clearData = () => {
    sessionStorage.removeItem("currentSignRequestId");
    if (subscriberData.mobileNo) {
      sessionStorage.removeItem(`currentSignRequestId_${subscriberData.mobileNo}`);
    }
    localStorage.removeItem("subscriberData"); // subscriberData
    localStorage.removeItem("membershipData");
    localStorage.removeItem("nomineeData");
    localStorage.removeItem("bankData");
    localStorage.removeItem("guardaianData");
    setSubscriberData({});
    setMembershipData({});
    setNomineeData({});
    setBankData({});
    setGuardianData({});
    setPhone("");
    setdraftIDData("");
    setPermanentAddress("");
  };

  const clearError = (fieldName) => {
    seterrorValidate((prev) => ({
      ...prev,
      [fieldName]: undefined,
    }));
  };
  useEffect(() => {
    localStorage.setItem("subscriberData", JSON.stringify(subscriberData));
    localStorage.setItem("membershipData", JSON.stringify(membershipData));
    localStorage.setItem("nomineeData", JSON.stringify(nomineeData));
    localStorage.setItem("bankData", JSON.stringify(bankData));
    localStorage.setItem("guardaianData", JSON.stringify(guardaianData));
  }, [subscriberData, membershipData, nomineeData, bankData, guardaianData]);
  const branch1 = localStorage.getItem("decodedBranch");

  const emailBindCache = useRef({ email: "", message: null });

  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

  const mobilesMatch = (left, right) => {
    const a = digitsOnly(left);
    const b = digitsOnly(right);
    if (!a || !b) return false;
    return a === b || a.endsWith(b) || b.endsWith(a);
  };

  const boundMobileFromRecord = (record) => {
    const found = [];
    const push = (value) => {
      const text = String(value || "").trim();
      if (!text || text.includes("@")) return;
      if (digitsOnly(text).length >= 8) found.push(text);
    };
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      Object.entries(node).forEach(([key, value]) => {
        if (/mobile|phone|contact/i.test(key)) push(value);
        else if (value && typeof value === "object") walk(value);
      });
    };
    walk(record);
    return found[0] || "";
  };

  const currentCustomerId = () => {
    if (Array.isArray(selectedCustomerID)) return selectedCustomerID[0]?.CustomerID || "";
    return selectedCustomerID?.CustomerID || "";
  };

  const checkEmailBinding = async (email) => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized || !normalized.includes("@") || selectedCountry !== "Singapore") return "";
    if (emailBindCache.current.email === normalized && emailBindCache.current.message !== null) {
      return emailBindCache.current.message;
    }

    let crmList = null;
    try {
      const res = await fetch(`${SG_SEARCH_CUSTOMER_API}/${encodeURIComponent(normalized)}`);
      if (res.ok) crmList = await res.json();
    } catch (err) {
      try {
        const proxyRes = await fetch(`/api/crm/api_db.js/api/Searchcustomer/${encodeURIComponent(normalized)}`);
        if (proxyRes.ok) crmList = await proxyRes.json();
      } catch (proxyErr) {
        console.warn("Email binding lookup failed:", proxyErr);
      }
    }

    const record = Array.isArray(crmList) ? crmList.find((row) => {
      const rowEmail = String(row?.EmailID || row?.email || "").trim().toLowerCase();
      return !rowEmail || rowEmail === normalized;
    }) : null;

    let message = "";
    if (record) {
      const formMobile = subscriberData.mobileNo || (phone && !String(phone).includes("@") ? phone : "");
      const boundMobile = boundMobileFromRecord(record);
      const sameCustomer = currentCustomerId() && String(record.CustomerID || "").toLowerCase() === String(currentCustomerId()).toLowerCase();
      const sameMobile = boundMobile && mobilesMatch(boundMobile, formMobile);
      if (!sameCustomer && !sameMobile) {
        message = boundMobile
          ? `This gmail is already binded to this mobile no ${boundMobile}`
          : "This gmail is already binded to another mobile number";
      }
    }

    emailBindCache.current = { email: normalized, message };
    return message;
  };

  const On_click_subsriber_validation = async () => {
    const errors = validateSubscriber();
    if (Object.keys(errors).length === 0) {
      const bindMsg = await checkEmailBinding(subscriberData.email);
      if (bindMsg) {
        toast.error(bindMsg);
        seterrorValidate((prev) => ({ ...prev, email: bindMsg }));
        setExpanded("subscriber-header");
        return true;
      }
      showGuardianDetails
        ? setExpanded("guardian-header")
        : setExpanded("membership-header");
    } else {
      const fieldError = Object.values(errors)[0]; // Get the first error message
      toast.error(fieldError);
      setExpanded("subscriber-header");
      return true;
    }
    // SetFirstElement();
  };

  const On_click_guardian_validation = async () => {
    const sub = await On_click_subsriber_validation();

    if (sub) {
      setExpanded("subscriber-header");
      return;
    }
    const errors = validateGuardian();
    console.log("gurdian validation result", errors);
    if (Object.keys(errors).length === 0) {
      setExpanded("membership-header");
    } else {
      const fieldError = Object.values(errors)[0]; // Get the first error message
      toast.error(fieldError);
      setExpanded("guardian-header");
      return true;
    }

    // SetFirstElement();
  };

  const On_click_membership_validation = async () => {
    const sub = await On_click_subsriber_validation();
    if (sub) {
      setExpanded("subscriber-header");
      return false;
    }
  
    const gub = await On_click_guardian_validation();
    if (gub) {
      setExpanded("guardian-header");
      return;
    }
    const errors = validateMembership();
    console.log("gurdianmm validation result", errors);
    if (Object.keys(errors).length === 0) {
      setExpanded("nominee-header");
    } else {
      const fieldError = Object.values(errors)[0]; // Get the first error message
      toast.error(fieldError);
      setExpanded("membership-header");
      return true;
    }
    // SetFirstElement();
  };

  const On_click_nominee_validation = async (targetSection = "bank-header") => {
    const sub = await On_click_subsriber_validation();
    if (sub) {
      setExpanded("subscriber-header");
      return true;
    }
    const gub = await On_click_guardian_validation();
    if (gub) {
      setExpanded("guardian-header");
      return true;
    }
    const meb = await On_click_membership_validation();
    if (meb) {
      setExpanded("membership-header");
      return true;
    }
    const errors = validateNominee();
    if (Object.keys(errors).length === 0) {
      const defaultNext = selectedCountry === "Singapore" ? "uploaddoc-header" : "bank-header";
      const nextHeader = typeof targetSection === "string" ? targetSection : defaultNext;
      setExpanded(nextHeader);
      return false;
    } else {
      const fieldError = Object.values(errors)[0]; // Get the first error message
      toast.error(fieldError);
      setExpanded("nominee-header");
      return true;
    }
  };

  const On_click_bank_validation = async (targetSection = "uploaddoc-header") => {
    const sub = await On_click_subsriber_validation();
    if (sub) {
      setExpanded("subscriber-header");
      return true;
    }
    const gub = await On_click_guardian_validation();
    if (gub) {
      setExpanded("guardian-header");
      return true;
    }
    const meb = await On_click_membership_validation();
    if (meb) {
      setExpanded("membership-header");
      return true;
    }
    const nom = await On_click_nominee_validation("bank-header");
    if (nom) {
      return true;
    }
    const errors = validateBank(); // Validate the bank details
    if (Object.keys(errors).length === 0) {
      const nextHeader = typeof targetSection === "string" ? targetSection : "uploaddoc-header";
      setExpanded(nextHeader);
      return false;
    } else {
      const fieldError = Object.values(errors)[0]; // Get the first error message
      toast.error(fieldError);
      setExpanded("bank-header");
      return true;
    }
  };
  const validatedocs = async () => {
    const isSingapore = selectedCountry === "Singapore";

    const sub = await On_click_subsriber_validation();
    if (sub) {
      setExpanded("subscriber-header");
      return false;
    }
    const gub = await On_click_guardian_validation();
    if (gub) {
      setExpanded("guardian-header");
      return false;
    }

    const meb = await On_click_membership_validation();
    if (meb) {
      setExpanded("membership-header");
      return false;
    }

    const nom = await On_click_nominee_validation();
    if (nom) {
      setExpanded("nominee-header");
      return false;
    }

    if (!isSingapore) {
      const bank = await On_click_bank_validation();
      if (bank) {
        setExpanded("bank-header");
        return false;
      }
    }

    // Check if any address proof document is uploaded
    const isAddressUploaded = uploadedDocs.some(
      (doc) => (doc.DocumentID && Number(doc.DocumentID) > 0) || ["AAD", "DRI", "VOT", "PAS", "PAN", "NRIC", "FIN", "SOD", "OTH", "ADB"].includes(doc.Type)
    );

    console.log("uploadedDocs", uploadedDocs);
    console.log("isAddressUploaded", isAddressUploaded);
    console.log("aadharverified", aadharverified);

    // Only require address proof for India if not Aadhaar e-verified AND no documents uploaded
    if (!isSingapore && !isAddressUploaded && aadharverified !== 1) {
      toast.error("Please Upload at least one Address Proof document");
      setExpanded("uploaddoc-header");
      return false;
    }

    // If documents are okay or Singapore or Aadhaar is verified, proceed to camera
    setExpanded("camera-header");
    return true;
  };

  const On_click_payment_camera_validation = async () => {
    const sub = await On_click_subsriber_validation();
    if (sub) {
      setExpanded("subscriber-header");
      return false;
    }
    const gub = await On_click_guardian_validation();
    if (gub) {
      setExpanded("guardian-header");
      return false;
    }

    const meb = await On_click_membership_validation();
    if (meb) {
      setExpanded("membership-header");
      return false;
    }

    const nom = await On_click_nominee_validation();
    if (nom) {
      setExpanded("nominee-header");
      return false;
    }

    const bank = await On_click_bank_validation();
    if (bank) {
      setExpanded("bank-header");
      return false;
    }

    const doc = await validatedocs();
    if (!doc) {
      setExpanded("uploaddoc-header");
      return false;
    }

    if (!image) {
      toast.error("Please capture your image.");
      setExpanded("camera-header");
      return false;
    } else {
      setExpanded("payment-header");
      return;
    }
  };

  // const On_click_uploaddoc_validation = () => {
  //   // const bnk=On_click_bank_validation()
  //   // if(bnk){
  //   //   setExpanded("bank-header")
  //   //   return
  //   // }
  //   const doc = validatedocs();
  //   SetSecondElement();
  //   // return doc
  // };

  // const On_click_camera_validation = () => {
  //   validatedocs();
  // };

  const CallModal = () => {
    // alert("calling modal")
    setOpenModal(true);
  };


  const SaveData = async (overrideMode) => {
    const activeMode = overrideMode || paymentmode;
    console.log("SaveData called with activeMode:", activeMode);

    if (activeMode === "online") {
      // For online payment, create new draft
      const handle = await saveDraft(activeMode);
      return handle;
    }
    else if (activeMode === "offline") {
      // Check if switching from online to offline (draft already exists)
      if (draftIDData) {
        try {
          console.log("Updating existing draft to offline payment method");
          setIsSaving(true);

          // Signature PDF and a second Customerdatacreate are not called on offline save.

          setIsSaving(false);
          setopenofflineModal(true);
          return draftIDData;
        } catch (error) {
          console.error("Error updating draft payment method:", error);

          // Handle different types of errors
          if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Error updating payment method");
          }
          return false;
        } finally {
          setIsSaving(false);
        }
      } else {
        // No existing draft, create new one with offline payment
        const handle = await saveDraft(activeMode);
        console.log("handle in mypage for new offline draft", handle);
        if(handle) {
          setopenofflineModal(true);
        }
        return handle;
      }
    }
  };
  return (
    <Container component="main" className="mypage-header" maxWidth="md">
      {isSaving && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(5px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "all 0.3s ease"
        }}>
          <div className="spinner-border" role="status" style={{ width: "3rem", height: "3rem", color: "#8c5c34" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: "16px", color: "#8c5c34", fontWeight: "600", fontSize: "16px" }}>
            Saving, please wait...
          </p>
        </div>
      )}
      <CssBaseline />
      <Header branch={branch1} />
      <div className="header-container flex items-center justify-between px-4 py-3">
        <div>
          <Link to={`/?branch=${branch1}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                position: "relative",
                // backgroundColor:"white",
                display: "inline-block",
                fontWeight: "bold",
              }}
            >
              <img
                src={`${process.env.PUBLIC_URL}/images/bhima_logo3.png`}
                alt="Home"
                style={{
                  width: "100px", // Adjust the size of the icon as needed
                  height: "60px", // Adjust the height accordingly
                  marginRight: "0px", // Add margin to create space between the icon and text
                  marginBottom: "15px",
                }}
              />
            </div>
          </Link>
        </div>

        <div className="flex-1 text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #4a2810, #7a4b27)",
              color: "#fcde7e",
              border: "1px solid #d4af37",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <span>{selectedCountry === "Singapore" ? "🇸🇬" : "🇮🇳"}</span>
            <span>{selectedCountry === "Singapore" ? "Singapore (S$ - SGD)" : "India (₹ - INR)"}</span>
          </div>
          <h2
            className="text-black"
            style={{ fontFamily: "Quiche Sans", fontWeight: "normal", color: "white", margin: 0 }}
          >
            ENROLLMENT
          </h2>
        </div>
      </div>

      <Box mb={2}>
        <Accordion
          expanded={expanded === "subscriber-header"}
          onChange={() =>
            setExpanded(
              expanded === "subscriber-header" ? false : "subscriber-header"
            )
          }
          sx={{
            background:
              "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
            color: "#fff", // Ensure text remains readable
            borderRadius: "8px", // Optional: Adds rounded corners
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="subscriber-content"
            id="subscriber-header"
          >
            <Typography sx={{ color: "#fff" }}>Subscriber Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Subscriberdetails
              flag={flag}
              setFlag={setFlag}
              setSubscriberData={setSubscriberData}
              newSubscriber={newSubscriber}
              errorValidate={errorValidate}
              selectedId={selectedId}
              selectedOption={selectedOption}
              customerData={customerData}
              phoneNo={phoneNo && !phoneNo.includes("@") ? phoneNo : ""}
              email={effectiveEmail}
              loginMethod={loginMethod || (effectiveEmail ? "email" : "mobile")}
              clearError={clearError}
              showGuardianDetails={showGuardianDetails}
              setShowGuardianDetails={setShowGuardianDetails}
              validationdisable={IsDisabledCheck}
            />
          </AccordionDetails>
        </Accordion>
      </Box>

      {showGuardianDetails && (
        <Box mb={2}>
          <Accordion
            expanded={expanded === "guardian-header"}
            onClick={On_click_subsriber_validation}
            onChange={() =>
              setExpanded(
                expanded === "guardian-header" ? false : "guardian-header"
              )
            }
            sx={{
              background:
                "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
              color: "#fff", // Ensure text remains readable
              borderRadius: "8px", // Optional: Adds rounded corners
            }}
          >
            {/* <Accordion expanded={expanded === 'guardian-header'} onChange={() => setExpanded(expanded === 'guardian-header' ? false : 'guardian-header')}>
             */}
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="guardian-content"
              id="guardian-header"
            >
              <Typography sx={{ color: "#fff" }}>Guardian Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <GuardaianDetails
                setGuardianData={setGuardianData}
                errorValidate={errorValidate}
                clearError={clearError}

              />
              <div className="button-container">
                {/* <button
                  className="styled-button"
                  onClick={() => {
                    const errors = validateGuardian();
                    if (Object.keys(errors).length === 0) {
                      setExpanded('membership-header');
                    } else {
                      const fieldError = Object.values(errors)[0]; // Get the first error message
                      toast.error(fieldError);
                    }
                  }}
                >
                 <i class="bi bi-arrow-right"></i>
                </button> */}
              </div>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      <Box mb={2}>
        <Accordion
          expanded={expanded === "membership-header"}
          onClick={On_click_guardian_validation}
          onChange={() =>
            setExpanded(
              expanded === "membership-header" ? false : "membership-header"
            )
          }
          sx={{
            background:
              "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
            color: "#fff", // Ensure text remains readable
            borderRadius: "8px", // Optional: Adds rounded corners
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="membership-content"
            id="membership-header"
          >
            <Typography sx={{ color: "#fff" }}>Scheme Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Membershipdetails
              validateMembership={validateMembership}
              setMembershipData={setMembershipData}
              membershipData={membershipData}
              branch={getCleanBranch(branch)}
              errorValidate={errorValidate}
              clearError={clearError}
              isdraftid_gen={IsDisabledall}
              preSelectedScheme={initialSelectedScheme}
            />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box mb={2}>
        <Accordion
          expanded={expanded === "nominee-header"}
          onClick={On_click_membership_validation}
          onChange={() =>
            setExpanded(
              expanded === "nominee-header" ? false : "nominee-header"
            )
          }
          sx={{
            background:
              "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
            color: "#fff", // Ensure text remains readable
            borderRadius: "8px", // Optional: Adds rounded corners
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="nominee-content"
            id="nominee-header"
          >
            <Typography sx={{ color: "#fff" }}>Nominee Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Nomineedeatils
              setNomineeData={setNomineeData}
              errorValidate={errorValidate}
              clearError={clearError}
              subscriberAddress={subscriberData}
              subscriberGender={subscriberData.gender}
              isdraftid_gen={IsDisabledall}
            />
          </AccordionDetails>
        </Accordion>
      </Box>

      {selectedCountry !== "Singapore" && (
        <Box mb={2}>
          <Accordion
            expanded={expanded === "bank-header"}
            onChange={(e, isExpanded) => {
              if (isExpanded) {
                On_click_nominee_validation("bank-header");
              } else {
                setExpanded(false);
              }
            }}
            sx={{
              background:
                "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
              color: "#fff", // Ensure text remains readable
              borderRadius: "8px", // Optional: Adds rounded corners
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="bank-content"
              id="bank-header"
            >
              <Typography sx={{ color: "#fff" }}>Bank Account Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paymentdetails
                setBankData={setBankData}
                errorValidate={errorValidate}
                clearError={clearError}
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Upload Documents accordion - visible for all countries; optional for Singapore */}
      <Box mb={2}>
        <Accordion
          expanded={expanded === "uploaddoc-header"}
          onChange={(e, isExpanded) => {
            if (isExpanded) {
              if (selectedCountry === "Singapore") {
                On_click_nominee_validation("uploaddoc-header");
              } else {
                On_click_bank_validation("uploaddoc-header");
              }
            } else {
              setExpanded(false);
            }
          }}
          sx={{
            background:
              "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
            color: "#fff", // Ensure text remains readable
            borderRadius: "8px", // Optional: Adds rounded corners
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="uploaddoc-content"
            id="uploaddoc-header"
          >
            <Typography sx={{ color: "#fff" }}>Upload Documents</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <UploadDocument
              amount={membershipData.installmentAmount}
              noOfInstallments={noOfInstallments}
              schemename={membershipData.selectedSchemeName}
              onFileUpload={handleFileUpload}
              uploadedDocs={uploadedDocs}
              onEkyc={() => setEkycQROpen(true)}
              aadharverified={aadharverified}
            />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box mb={2}>
        <Accordion
          expanded={expanded === "camera-header"}
          onClick={validatedocs}
          onChange={() =>
            setExpanded(expanded === "camera-header" ? false : "camera-header")
          }
          sx={{
            background: "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)", // same beige gradient
            color:"#fff",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)", // very subtle shadow
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#6b4a2b" }} />} // brown arrow
            aria-controls="camera-content"
            id="camera-header"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Icon Box */}
            {/* <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          backgroundColor: "#e5d8c7", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CameraIcon sx={{ color: "#6b4a2b" }} />
      </Box> */}

            <Box>
              <Typography sx={{  color:  "#fff" }}>
                Camera
              </Typography>
              <Typography sx={{ fontSize: "14px", color:  "#fff" }}>
                Click on the Camera to Capture your Photo
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <WebCamComponent
              getImageUrl={getImageUrl}
              capturedImage={image}
            />
          </AccordionDetails>
        </Accordion>
      </Box>


      <Box mb={2}>
        <Accordion
          expanded={expanded === "payment-header"}
          onClick={On_click_payment_camera_validation}
          onChange={() =>
            setExpanded(expanded === "payment-header" ? false : "payment-header")
          }
          sx={{
            background:
              "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
            color: "#fff", // Ensure text remains readable
            borderRadius: "8px", // Optional: Adds rounded corners
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="payment-content"
            id="payment-header"
          >
            <Typography sx={{ color: "#fff" }}>Payment</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paymentgateway
              setExpanded={setExpanded}
              savedraft={SaveData}
              handlepayment={handlepaymentupdate}
              openModal={CallModal}
              paymentMethodMode={handlepaymentMethod}
              handleModalOenOffline={handleModalOenOffline}
              onLinkGenerationStatus={handleLinkGenerationStatus}
              hasEkycSignature={!!ekycSignature}
              ekycSignature={ekycSignature}
              setEkycSignature={setEkycSignature}
              generateEnrollmentPdfProp={generateEnrollmentPdf}
            />
          </AccordionDetails>
        </Accordion>
      </Box>



      {/* <Box mb={2}>
        <Card
          style={{
            background:
              "linear-gradient(103.45deg, rgb(97, 65, 25) -11.68%, rgb(205, 154, 80) 48.54%, rgb(97, 65, 25) 108.76%)",
            color: "#fff", // Ensure text remains readable
            borderRadius: "8px", // Optional: Adds rounded corners
          }}
        >
          <Card.Body>
            <Card.Title>Payment</Card.Title>
            <Paymentgateway
              setExpanded={setExpanded}
              savedraft={SaveData}
              handlepayment={handlepaymentupdate}
              openModal={CallModal}
              paymentMethodMode={handlepaymentMethod}
              handleModalOenOffline={handleModalOenOffline}
            />
          </Card.Body>
        </Card>
      </Box> */}

      {/* Success Modal */}
      {/* <Modal
        open={openModal}
        onClose={(event, reason) => {
          if (reason && reason === "backdropClick") return; // Prevent close on outside click
          handleModalClose(); // Only close if it's not a backdrop click
        }}
        closeAfterTransition
        className="success-model-popup2"
      >
        <Fade in={openModal}>
          <Box sx={modalStyle} class="modal-content">
            <div className="text-center">
              <div className="icon-box">
                <CheckCircleIcon sx={{ fontSize: 60, color: "green" }} />  ///////////////// Mohith_dev///////////
              </div>
            </div>
            <Typography
              variant="h6"
              component="h2"
              align="center"
              sx={{
                mt: 2,
                fontSize: { xs: "16px" },
              }}
            >
              " Thank you for Subscribing for JPP Scheme"
            </Typography>
            <Typography sx={{ mt: 2 }} align="center">
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {subscriberData.mobileNo && !subscriberData.mobileNo.includes("@") && (
                  <li>Mobile No: {subscriberData.mobileNo}</li>
                )}
                {subscriberData.email && <li>Email: {subscriberData.email}</li>}
                <li>Subscriber Name: {subscriberData.subscriberName}</li>
                <li>Scheme Name: {membershipData.selectedSchemeName}</li>
                <li>
                  Installment Amount: ₹
                  {membershipData.installmentAmount
                    ? membershipData.installmentAmount.toLocaleString("en-IN")
                    : "N/A"}
                </li>
              </ul>
            </Typography>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px", // same as gap-x-5
              }}
            >
              <button
                className="custom-button1"
                style={{
                  display: "inline-block",
                  width: "100%",
                  marginTop: "20px",
                  padding: "12px",
                  borderRadius: "10px",
                  // background: "linear-gradient(90deg, #7b5ce6, #4f2dbf)",
                  color: "white",
                  textAlign: "center",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                }}
                onClick={handleModalClose}
              >
                OK
              </button>
            </div>
          </Box>
        </Fade>
      </Modal> */}

      <Modal
        open={openofflineModal}
        onClose={(event, reason) => {
          if (reason && reason === "backdropClick") return; // Prevent close on outside click
          handleModalClose(); // Only close if it's not a backdrop click
        }}
        closeAfterTransition
        className="success-model-popup2"
      >
        <Fade in={openofflineModal}>
          <Box sx={modalStyle} class="modal-content">
            <div className="text-center">
              <div className="icon-box">
                <CheckCircleIcon sx={{ fontSize: 60, color: "green" }} />
              </div>
            </div>
            <Typography
              variant="h6"
              component="h2"
              align="center"
              sx={{
                mt: 2,
                fontSize: { xs: "16px" },
              }}
            >
              "Thank you for your interest in the JPP Scheme. Please contact a
              Bhima agent to proceed with the payment."
            </Typography>
            <Typography sx={{ mt: 2 }} align="center">
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {subscriberData.mobileNo && !subscriberData.mobileNo.includes("@") && (
                  <li>Mobile No: {subscriberData.mobileNo}</li>
                )}
                {subscriberData.email && <li>Email: {subscriberData.email}</li>}
                <li>Subscriber Name: {subscriberData.subscriberName}</li>
                <li>Scheme Name: {membershipData.selectedSchemeName}</li>
                <li>
                  Installment Amount: {formatCurrency(membershipData.installmentAmount || 0, activeSymbol)}
                </li>
              </ul>
            </Typography>
            <button className="custom-button1 w-100" onClick={handleModalClose}>
              OK
            </button>
          </Box>
        </Fade>
      </Modal>

      <EkycQRModal
        open={ekycQROpen}
        onClose={() => setEkycQROpen(false)}
        phoneNo={phoneNo}
        onEkycComplete={handleEkycComplete}
        enrollmentData={{
          name: subscriberData.subscriberName || "",
          scheme: membershipData.selectedSchemeName || "",
          amount: membershipData.installmentAmount || "",
          dob: subscriberData.dob || "",
          gender: subscriberData.gender || "",
          address: [subscriberData.address1, subscriberData.address2, subscriberData.address3].filter(Boolean).join(", "),
          city: subscriberData.city || "",
          state: subscriberData.state || "",
          pincode: subscriberData.pinCode || "",
        }}
      />

      <ToastContainer />
    </Container>
  );
};

export default Mypage;
