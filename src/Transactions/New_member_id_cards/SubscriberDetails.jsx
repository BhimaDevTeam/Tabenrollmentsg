import React, { useState, useEffect, useRef } from "react";
import { Form, Col, Row, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import PickDate from "../PickDate/PickDate";
// import GuardaianDetails from "./GuardaianDetails";
import { calculateAge } from "../PickDate/DateUtils";
import { useDispatch, useSelector } from "react-redux";
import { setIsMinorDisable } from "../../redux/customer/customerSlice";
import { PincodeAPI } from "../../apiurl";
import { searchSingaporePostal } from "../../utlis/oneMapUtils";

const Subscriberdetails = ({
  setSubscriberData,
  showGuardianDetails,
  setShowGuardianDetails,
  selectedOption,
  selectedId,
  newSubscriber,
  customerData,
  phoneNo,
  email: passedEmail,
  loginMethod,
  errorValidate,
  clearError,
  flag,
  setFlag,
  onEmailLeave,
  onMobileLeave,
}) => {
  const { customer: customerList, selectedCustomerID, isOtherCustomer, selectedCountry } = useSelector(
    (state) => state.customer || {}
  );
  const isSingapore = selectedCountry === "Singapore";
  const dispatch = useDispatch();
  const [error, setErrors] = useState({});
  const [isminorDisabled, setIsMinorDisabled] = useState(false);
  const address1Ref = useRef(null);
  const [formKey, SetformKey] = useState("");

  const isMajor = (user) => {
    if (!user) return false;
    if (user.IsAdult === true || user.IsAdult === "true" || user.major === "Y" || user.isMajor === "Y" || user.isMajor === true) {
      return true;
    }
    if (user.IsAdult === false || user.IsAdult === "false" || user.major === "N" || user.isMajor === "N" || user.isMajor === false) {
      return false;
    }
    const dob = user.DateOfBirth || user.DateOf_Birth || user.dob || user.DOB;
    if (!dob) return false;
    const age = calculateAge(dob);
    return age !== null && !isNaN(age) && age >= 18;
  };

  const cleanMobileNumber = (val) => {
    if (!val || typeof val !== "string") return "";
    const trimmed = val.trim();
    if (trimmed === "-" || trimmed === "NA" || trimmed === "null" || trimmed === "undefined" || trimmed.includes("@") || /[a-zA-Z]/.test(trimmed)) return "";
    return trimmed;
  };

  const majorSubscriber = Array.isArray(customerList) ? customerList.find(u => isMajor(u)) : null;
  const initialEmail =
    passedEmail ||
    (phoneNo && phoneNo.includes("@") ? phoneNo : "") ||
    (typeof window !== "undefined" ? localStorage.getItem("customerEmail") || "" : "") ||
    majorSubscriber?.EmailID ||
    majorSubscriber?.email_id ||
    majorSubscriber?.email ||
    majorSubscriber?.Email ||
    (Array.isArray(customerList) && customerList.find(u => u?.EmailID || u?.email_id || u?.email)?.EmailID) ||
    (Array.isArray(customerList) && customerList.find(u => u?.EmailID || u?.email_id || u?.email)?.email_id) ||
    (Array.isArray(customerList) && customerList.find(u => u?.EmailID || u?.email_id || u?.email)?.email) ||
    selectedCustomerID?.EmailID ||
    selectedCustomerID?.email_id ||
    selectedCustomerID?.email ||
    "";
  const initialMobile = cleanMobileNumber(phoneNo);

  const selectedRecord = Array.isArray(selectedCustomerID) ? selectedCustomerID[0] : selectedCustomerID;
  const isExistingCustomer = Boolean(
    (selectedRecord && (selectedRecord.CustomerID || selectedRecord.Cust_ID || selectedRecord.Name)) ||
    (!newSubscriber && Array.isArray(customerList) && customerList.length > 0 && selectedId !== "new" && selectedId !== "minor")
  );

  const isMobileLogin = loginMethod === "mobile" || (Boolean(phoneNo) && !phoneNo.includes("@"));
  const isEmailLogin = loginMethod === "email" || (Boolean(phoneNo) && phoneNo.includes("@"));

  const savedMobile = cleanMobileNumber(
    selectedRecord?.MobileNo || selectedRecord?.Mobile_No || selectedRecord?.mobileNo || (isMobileLogin ? phoneNo : "")
  );
  const mobileLocked = Boolean(savedMobile);

  const savedEmail = (
    selectedRecord?.EmailID ||
    selectedRecord?.email_id ||
    selectedRecord?.email ||
    majorSubscriber?.EmailID ||
    majorSubscriber?.email_id ||
    majorSubscriber?.email ||
    (isExistingCustomer ? initialEmail : "") ||
    (isEmailLogin ? (phoneNo && phoneNo.includes("@") ? phoneNo : passedEmail) : "") ||
    ""
  ).trim();
  const emailLocked = Boolean(savedEmail);

  const [isMobileVerified, setIsMobileVerified] = useState(
    Boolean(savedMobile) || isMobileLogin || isExistingCustomer
  );
  const [isEmailVerified, setIsEmailVerified] = useState(
    emailLocked || isEmailLogin || (isExistingCustomer && Boolean(selectedRecord?.EmailID || selectedRecord?.email_id || selectedRecord?.email))
  );

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState("mobile");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpModalError, setOtpModalError] = useState("");

  useEffect(() => {
    if (selectedRecord && (selectedRecord.CustomerID || selectedRecord.Cust_ID || selectedRecord.Name)) {
      if (cleanMobileNumber(selectedRecord.MobileNo || selectedRecord.Mobile_No)) {
        setIsMobileVerified(true);
      }
      if (selectedRecord.EmailID || selectedRecord.email_id || selectedRecord.email) {
        setIsEmailVerified(true);
      }
    }
  }, [selectedRecord]);

  const openOtpFor = async (target) => {
    if (target === "mobile") {
      const cleanMob = String(formData.mobileNo || "").replace(/\D/g, "");
      const reqLen = isSingapore ? 8 : 10;
      if (!cleanMob) {
        toast.error("Please enter a mobile number first.");
        return;
      }
      if (cleanMob.length !== reqLen) {
        toast.error(`Mobile number must be ${reqLen} digits.`);
        return;
      }
      if (errorValidate?.mobileNo) {
        toast.error(errorValidate.mobileNo);
        return;
      }
      if (onMobileLeave) {
        const bindErr = await onMobileLeave(cleanMob, formData.email || savedEmail || "");
        if (bindErr) {
          toast.error(bindErr);
          return;
        }
      }
      setOtpTarget("mobile");
      setEnteredOtp("");
      setOtpModalError("");
      setShowOtpModal(true);
    } else if (target === "email") {
      const email = String(formData.email || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        toast.error("Please enter a valid email address first.");
        return;
      }
      if (errorValidate?.email) {
        toast.error(errorValidate.email);
        return;
      }
      if (onEmailLeave) {
        const bindErr = await onEmailLeave(email, formData.mobileNo || "");
        if (bindErr) {
          toast.error(bindErr);
          return;
        }
      }
      setOtpTarget("email");
      setEnteredOtp("");
      setOtpModalError("");
      setShowOtpModal(true);
    }
  };

  const handleVerifyInsideOtp = () => {
    if (enteredOtp.trim() !== "123456") {
      setOtpModalError("Invalid OTP. Please enter 123456");
      return;
    }
    if (otpTarget === "mobile") {
      setIsMobileVerified(true);
      if (clearError) clearError("mobileNo");
      toast.success("Mobile number verified successfully!");
    } else {
      setIsEmailVerified(true);
      if (clearError) clearError("email");
      toast.success("Email verified successfully!");
    }
    setShowOtpModal(false);
    setEnteredOtp("");
    setOtpModalError("");
  };

  const normalizeGender = (g) => {
    if (!g) return "";
    const str = String(g).trim().toUpperCase();
    if (str === "M" || str.startsWith("MALE")) return "Male";
    if (str === "F" || str.startsWith("FEMALE")) return "Female";
    if (str === "O" || str.startsWith("OTHER")) return "Others";
    return "";
  };

  const initialCustObj = (selectedCustomerID && (selectedCustomerID.Name || selectedCustomerID.CustomerID || selectedCustomerID.Gender || Object.keys(selectedCustomerID).length > 0))
    ? selectedCustomerID
    : (Array.isArray(customerData) && customerData.length > 0 ? customerData[0] : (Array.isArray(customerList) && customerList.length > 0 ? customerList[0] : null));

  const initialRawGender =
    newSubscriber?.Gender ||
    newSubscriber?.gender ||
    newSubscriber?.Sex ||
    newSubscriber?.Names?.[0]?.Gender ||
    initialCustObj?.Gender ||
    initialCustObj?.gender ||
    initialCustObj?.Sex ||
    initialCustObj?.Names?.[0]?.Gender ||
    "";
  const initialGender = normalizeGender(initialRawGender);

  const [areaName, setAreas] = useState([]);
  const [formData, setFormData] = useState({
    mobileNo: initialMobile,
    subscriberName: "",
    gender: initialGender || "",
    address1: "",
    address2: "",
    address3: "",
    permanentAddress: "",
    pinCode: "",
    area: "",
    city: "",
    state: "",
    email: initialEmail,
    dob: "",
  });
  const [age, setAge] = useState(false);
  const [area, setArea] = useState("");
  const [addressInput, setAddressInput] = useState("");

  useEffect(() => {
    if (newSubscriber) {
      // Auto-fill the form and disable fields for newSubscriber

      const newSubRawGender =
        newSubscriber?.Gender ||
        newSubscriber?.gender ||
        newSubscriber?.Sex ||
        newSubscriber?.sex ||
        newSubscriber?.Names?.[0]?.Gender ||
        "";
      const newSubGender = normalizeGender(newSubRawGender);

      // Merge Address1, Address2, and Address3 into a single address
      const mergedAddress = [
        newSubscriber.Address1,
        newSubscriber.Address2,
        // newSubscriber.Address3
      ].filter(addr => addr && addr.trim()).join(", ");

    ///////////////////Mohith Dev////////////////////////
      const combinedAddress = [
        newSubscriber?.Address1,
        newSubscriber?.Address2,
        newSubscriber?.Address3,
        newSubscriber?.State,
        newSubscriber?.PinCode
      ]
        .filter(Boolean)         // removes null/undefined/empty strings
        .join(", ");             // join with commas (or space if you prefer)

      const ekycAddress = (!newSubscriber?.Address1 || !newSubscriber?.Address2) ? combinedAddress : mergedAddress;

      const newEmail = newSubscriber.email_id || newSubscriber.Email_ID || newSubscriber.EmailID || newSubscriber.email || "";
      const newPinCode = newSubscriber.Pin_Code || newSubscriber.PinCode || newSubscriber.pinCode || "";

      setFormData((prevFormData) => {
        const userEnteredAddress = prevFormData.address1 || addressInput || "";
        return {
          ...prevFormData,
          mobileNo: cleanMobileNumber(newSubscriber.MobileNo) || initialMobile || cleanMobileNumber(prevFormData.mobileNo) || "",
          subscriberName: newSubscriber.Cust_Name || newSubscriber.CustomerName || newSubscriber.Name || prevFormData.subscriberName || "",
          gender: newSubGender || prevFormData.gender || "",
          address1: userEnteredAddress ? userEnteredAddress : ekycAddress,
          permanentAddress: ekycAddress,
          area: newSubscriber.Locality || newSubscriber.Address3 || prevFormData.area || "",
          pinCode: newPinCode || prevFormData.pinCode || "",
          city: newSubscriber.City || prevFormData.city || "",
          state: newSubscriber.State || prevFormData.state || "",
          email: newEmail || initialEmail || prevFormData.email || "",
          dob: newSubscriber.DOB || newSubscriber.DateOfBirth || newSubscriber.DateOf_Birth || prevFormData.dob || "",
        };
      });
      // setIsAadharDisabled(true);
      setArea((prevArea) => prevArea || newSubscriber.Locality || newSubscriber.Address3 || "");

      setAddressInput((prevInput) => (prevInput && prevInput.trim() ? prevInput : ekycAddress));
    } else {
      // Handle customerData
      const customer = (selectedCustomerID && (selectedCustomerID.Name || selectedCustomerID.CustomerID || selectedCustomerID.Gender || Object.keys(selectedCustomerID).length > 0))
        ? selectedCustomerID
        : (Array.isArray(customerData) && customerData.length > 0 ? customerData[0] : (Array.isArray(customerList) && customerList.length > 0 ? customerList[0] : null));

      if (customer) {
        const custRawGender =
          customer.Gender ||
          customer.gender ||
          customer.Sex ||
          customer.sex ||
          customer.Names?.[0]?.Gender ||
          customer.Names?.[0]?.gender ||
          customer.Names?.[0]?.Sex ||
          "";
        const custGender = normalizeGender(custRawGender);

        setArea(customer.Locality || customer.Address3 || "");

        // Merge Address1, Address2, and Address3 into a single address
        const mergedAddress = [
          customer.Address1,
          customer.Address2,
          // customer.Address3
        ].filter(addr => addr && addr.trim()).join(", ");

        const isAadhaarVerified = customer.Isaadharverified === 1;
        const custEmail = customer.email_id || customer.Email_ID || customer.EmailID || customer.email || (customer.MobileNo && customer.MobileNo.includes("@") ? customer.MobileNo : "") || "";
        const custPinCode = customer.Pin_Code || customer.PinCode || customer.pinCode || "";

        setFormData((prevFormData) => {
          const userEnteredAddress = prevFormData.address1 || addressInput || "";
          return {
            ...prevFormData,
            mobileNo: cleanMobileNumber(customer.MobileNo || customer.Mobile_No) || initialMobile || cleanMobileNumber(prevFormData.mobileNo) || "",
            subscriberName:
              customer.Cust_Name || customer.CustomerName || customer.Name || customer.Aadharname || prevFormData.subscriberName || "",
            gender: custGender || prevFormData.gender || "",
            address1: userEnteredAddress ? userEnteredAddress : (mergedAddress || ""),
            permanentAddress: isAadhaarVerified ? (mergedAddress || "") : (prevFormData.permanentAddress || ""),
            area: customer.Locality || customer.Address3 || prevFormData.area || "",
            city: customer.City || prevFormData.city || "",
            state: customer.State || prevFormData.state || "",
            pinCode: custPinCode || prevFormData.pinCode || "",
            email: custEmail || prevFormData.email || "",
            dob: customer.DateOf_Birth || customer.DateOfBirth || prevFormData.dob || "",
          };
        });
        setAddressInput((prevInput) =>
          prevInput && prevInput.trim()
            ? prevInput
            : [customer.Address1, customer.Address2].filter((addr) => addr && addr.trim()).join(", ")
        );
      } else {
        // Handle case where customerData is empty or not provided
        setFormData((prevState) => ({
          ...prevState,
          mobileNo: initialMobile || cleanMobileNumber(prevState.mobileNo) || "",
        }));
        setArea("");
        setAddressInput("");
      }
    }
    SetformKey(Math.random());
  }, [customerList, selectedCustomerID, customerData, phoneNo, age, setShowGuardianDetails, newSubscriber]);

  // just for check delete later
  useEffect(() => {
    // console.log("isminorDisabled**", selectedId, isminorDisabled, formData);
  }, [selectedId, isminorDisabled, formData]);

  useEffect(() => {
    if (
      selectedId === "minor" ||
      selectedId === "new" ||
      selectedOption === "withoutAadhar"
    ) {
      setFormData((prev) => ({
        ...prev,
        // mobileNo: phoneNo ||"",
        subscriberName: "",
        gender: "",
        address1: "",
        area: "",
        pinCode: "",
        city: "",
        state: "",
        email: initialEmail || prev.email || "",
        dob: "",
      }));
    }
  }, [selectedId, selectedOption, initialEmail]);

  const hasExistingMajor = customerList && Array.isArray(customerList) && customerList.some((u) => isMajor(u));

  const getMaxMajorDob = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const targetEmail = savedEmail || initialEmail;
    if (targetEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: targetEmail }));
    }
  }, [savedEmail, initialEmail, formData.email]);

  useEffect(() => {
    const isEnrollingNew = !selectedCustomerID || (!selectedCustomerID.Cust_ID && !selectedCustomerID.CustomerID && !selectedCustomerID.Name);

    if (isEnrollingNew && (hasExistingMajor || selectedId === "minor")) {
      setErrors({ dob: "Only 1 major is allowed with this mobile number. Minor enrollment is not allowed." });
      setIsMinorDisabled(true);
      dispatch(setIsMinorDisable(true));
      setShowGuardianDetails(false);
      return;
    }

    if (formData.dob) {
      const age = calculateAge(formData.dob);
      if (age !== null && age < 18) {
        setErrors({ dob: "Minor enrollment is not allowed. Subscriber must be 18 years or older." });
        setIsMinorDisabled(true);
        dispatch(setIsMinorDisable(true));
        setShowGuardianDetails(false);
      } else {
        setErrors({});
        setIsMinorDisabled(false);
        dispatch(setIsMinorDisable(false));
        setShowGuardianDetails(false);
      }
    } else {
      setErrors({});
      setShowGuardianDetails(false);
    }
  }, [formData.dob, selectedId, newSubscriber, customerList, selectedCustomerID, hasExistingMajor]);

  useEffect(() => {
    setSubscriberData({
      ...formData,
      isMobileVerified,
      isEmailVerified,
    });
  }, [formData, isMobileVerified, isEmailVerified]);

  const handleDateChange = (newDate) => {
    setFormData((prevFormData) => ({ ...prevFormData, dob: newDate }));
    setFlag({
      ...flag,
      dob: true,
    });
    clearError("dob");
  };

  // const pinCodeRef = useRef(null);
  // const handleFocusOnPinCode = () => {
  //   pinCodeRef.current.focus();
  // };
  useEffect(() => {
    if (formData.pinCode) {
      fetchPinCodeDetails(formData.pinCode);
    }
  }, [formData.pinCode]);

  const [sgResultsState, setSgResultsState] = useState([]);

  const fetchPinCodeDetails = async (pinCode) => {
    if (isSingapore) {
      if (pinCode && pinCode.length === 6) {
        const res = await searchSingaporePostal(pinCode);
        const sgResults = res?.allResults || (res?.primary ? [res.primary] : []);
        if (sgResults.length > 0) {
          setSgResultsState(sgResults);
          const areaOptions = sgResults.map((r) => r.displayLabel);
          setAreas(areaOptions);

          const selectedObj = sgResults[0];
          const defaultStreetAddr = selectedObj.streetAddress || selectedObj.fullAddress || "";
          setFormData((prevFormData) => ({
            ...prevFormData,
            address1: defaultStreetAddr,
            address2: selectedObj.building || "",
            city: "Singapore",
            state: "Singapore",
            area: selectedObj.displayLabel,
          }));
          setAddressInput(defaultStreetAddr);
          clearError("pinCode");
          clearError("city");
          clearError("state");
          clearError("area");
          clearError("address1");
        } else {
          setFormData((prevFormData) => ({
            ...prevFormData,
            city: "Singapore",
            state: "Singapore",
          }));
          setAreas(["Singapore"]);
          setSgResultsState([]);
        }
      }
      return;
    }

    try {
      const response = await fetch(`${PincodeAPI}/${pinCode}`);
      const data = await response.json();
      if (data[0].Status === "Success") {
        const postOfficeData = data[0].PostOffice;
        const areaName = postOfficeData.map((office) => office.Name);
        const state = postOfficeData[0].State;
        const city = postOfficeData[0].District;
        setFormData((prevFormData) => ({
          ...prevFormData,
          area: prevFormData.area, // Preserve existing area if multiple
          state: state,
          city,
        }));
        setAreas(areaName); // Populate cities in case of multiple cities
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pinCode: "Invalid pin code",
        }));
        setAreas([]); // Clear cities if invalid pin code
        clearError("state");
        clearError("city");
        clearError("area");
      }
    } catch (error) {
      console.error("Error fetching pin code details:", error);
    }
  };

  const handlePinCodeChange = (e) => {
    const { value } = e.target;
    if (/^\d{0,6}$/.test(value)) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        pinCode: value,
        ...(isSingapore ? { city: "Singapore", state: "Singapore" } : {}),
      }));

      setFlag({
        ...flag,
        pinCode: true,
      });

      if (value.length === 6) {
        fetchPinCodeDetails(value);
      } else {
        clearError("pinCode");
        if (!isSingapore) {
          clearError("city");
          clearError("state");
          clearError("area");

          setFormData((prevFormData) => ({
            ...prevFormData,
            city: "",
            area: "",
            state: "",
          }));
          setAreas([]);
        }
      }
    }
  };
  const handleGenderChange = (value) => {
    setFormData((prevFormData) => ({ ...prevFormData, gender: value }));
    setFlag({
      ...flag,
      gender: true,
    });
    clearError("gender");
  };
  const handleFocus = () => {
    if (!formData.address1) {
      address1Ref.current.focus(); // Focus back to address1 if empty
    }
  };
  const handleAddressChange = (e) => {
    setAddressInput(e.target.value);
    setFlag({
      ...flag,
      address1: true,
    });
    clearError("address1");
  };

  const handleAddressBlur = () => {
    const parts = addressInput.split(",").map((part) => part.trim());
    setFormData((prevFormData) => ({
      ...prevFormData,
      address1: parts[0] || "",
      address2: parts[1] || "",
      address3: parts[2] || "",
    }));
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    const upperCaseValue = value.toUpperCase(); // Convert to uppercase
    if (/^[a-zA-Z\s]*$/.test(upperCaseValue)) {
      // Only allow alphabets and spaces
      setFormData((prevFormData) => ({
        ...prevFormData,
        subscriberName: upperCaseValue,
      }));
      setFlag({
        ...flag,
        subscriberName: true,
      });
      clearError("subscriberName");
    }
  };

  const handleEmailChange = (e) => {
    if (emailLocked) return; // Do not allow change when email already exists on record/login
    const { value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      email: value,
    }));
    setIsEmailVerified(false);
    setFlag({
      ...flag,
      email: true,
    });
    if (clearError) clearError("email");
  };

  const handleEmailBlur = () => {
    const email = (formData.email || initialEmail || "").trim();
    if (onEmailLeave) onEmailLeave(email, formData.mobileNo || "");
  };

  const handleMobileBlur = () => {
    const mob = cleanMobileNumber(formData.mobileNo || savedMobile || "");
    if (onMobileLeave && !mobileLocked) {
      onMobileLeave(mob, formData.email || savedEmail || "");
    }
  };
  const [oldAddressData, setOldAddressData] = useState(null); // State to store old address data
  const [isNewAddressMode, setIsNewAddressMode] = useState(false);
  const handleAddressEdit = (e) => {
    // Store the old address data before clearing
    setOldAddressData({
      address1: formData.address1,
      area: formData.area,
      pinCode: formData.pinCode,
      city: formData.city,
      state: formData.state,
    });

    setFormData((prev) => ({
      ...prev,
      address1: "",
      area: "",
      pinCode: "",
      city: "",
      state: "",
    }));
    setArea("");
    address1Ref.current.focus();
    setIsNewAddressMode(true); // Enter new address mode
  };

  const handleRevertAddress = () => {
    if (oldAddressData) {
      setFormData((prev) => ({
        ...prev,
        address1: oldAddressData.address1,
        area: oldAddressData.area,
        pinCode: oldAddressData.pinCode,
        city: oldAddressData.city,
        state: oldAddressData.state,
      }));
      setArea(oldAddressData.area);
      setOldAddressData(null); // Clear the stored old data
      setIsNewAddressMode(false); // Exit new address mode
    }
  };
  // const handleAddressEdit = (e) => {
  //   setFormData((prev) => {
  //     return {
  //       ...prev,
  //       address1: "",
  //       area: "",
  //       pinCode: "",
  //       city: "",
  //       state: "",
  //     };
  //   });
  //   setArea("");
  //   address1Ref.current.focus();
  // };

  const handleAreaChange = (e) => {
    const areaValue = e.target.value;
    if (isSingapore && sgResultsState && sgResultsState.length > 0) {
      const matchedObj = sgResultsState.find((r) => r.displayLabel === areaValue) || sgResultsState[0];
      const streetAddr = matchedObj.streetAddress || matchedObj.fullAddress || matchedObj.displayLabel || "";
      setFormData((prevData) => ({
        ...prevData,
        area: matchedObj.displayLabel,
        address1: streetAddr,
        address2: matchedObj.building || "",
        city: "Singapore",
        state: "Singapore",
      }));
      // Also update addressInput so the Address textarea reflects the selection
      setAddressInput(streetAddr);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        area: areaValue,
      }));
      // If address is empty, populate with selected area
      if (!addressInput || !addressInput.trim()) {
        setAddressInput(areaValue);
      }
    }
    setFlag((prevFlag) => ({
      ...prevFlag,
      area: true,
    }));
    clearError("area");
  };
  const handleKeyDownPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
    }
  };

  return (
    <div className="container">
      <Form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDownPress}>
        <Form.Group controlId="formMobileNo" className="form-group">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <Form.Label className="form-label mb-0">
              Mobile No*:{" "}
              {isMobileVerified ? (
                <span style={{ fontSize: "11px", color: "#28a745", fontWeight: "700", marginLeft: "6px" }}>
                  ✓ (Verified)
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: "600", marginLeft: "6px" }}>
                  (Unverified)
                </span>
              )}
            </Form.Label>
            {!isMobileVerified && (
              <button
                type="button"
                onClick={() => openOtpFor("mobile")}
                style={{
                  background: "#614119",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                Verify with OTP
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                background: "#e9ecef",
                color: "#495057",
                fontWeight: "700",
                fontSize: "14px",
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRight: "none",
                borderRadius: "4px 0 0 4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: "38px",
                boxSizing: "border-box",
              }}
            >
              <span>{isSingapore ? "🇸🇬" : "🇮🇳"}</span>
              <span>{isSingapore ? "+65" : "+91"}</span>
            </span>
            <Form.Control
              type="text"
              value={cleanMobileNumber(formData.mobileNo) || savedMobile}
              onChange={(e) => {
                if (mobileLocked) return;
                const val = e.target.value.replace(/\D/g, "");
                const maxLen = isSingapore ? 8 : 10;
                if (val.length <= maxLen) {
                  setFormData((prev) => ({ ...prev, mobileNo: val }));
                  setIsMobileVerified(false);
                  if (clearError) clearError("mobileNo");
                }
              }}
              placeholder={isSingapore ? "Enter 8-digit mobile number" : "Enter 10-digit mobile number"}
              onBlur={handleMobileBlur}
              className="form-control"
              disabled={mobileLocked || isMobileVerified}
              readOnly={mobileLocked || isMobileVerified}
              style={(mobileLocked || isMobileVerified)
                ? { borderRadius: "0 4px 4px 0", backgroundColor: "#e9ecef", cursor: "not-allowed", color: "#495057" }
                : { borderRadius: "0 4px 4px 0" }}
            />
            {isMobileVerified && !mobileLocked && (
              <button
                type="button"
                onClick={() => setIsMobileVerified(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6c757d",
                  fontSize: "12px",
                  marginLeft: "8px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textDecoration: "underline",
                }}
                title="Change mobile number"
              >
                Change
              </button>
            )}
          </div>
          {errorValidate.mobileNo && (
            <Form.Text className="text-danger">{errorValidate.mobileNo}</Form.Text>
          )}
        </Form.Group>

        <Form.Group controlId="formSubscriberName" className="form-group">
          <Form.Label className="form-label">Subscriber Name*:</Form.Label>
          <Form.Control
            placeholder="Enter subscriber name"
            value={formData.subscriberName}
            onChange={handleNameChange}
            className="form-control custom-placeholder"
            required
            disabled={
              isminorDisabled ||
              (flag.subscriberName ? false : formData.subscriberName?.length)
            }
          />
          {errorValidate.subscriberName && (
            <Form.Text className="text-danger">
              {errorValidate.subscriberName}
            </Form.Text>
          )}
        </Form.Group>
        <PickDate
          dob={formData.dob}
          onDateChange={handleDateChange}
          disabled={flag.dob ? false : formData.dob?.length}
          errorValidate={errorValidate}
          clearError={clearError}
          maxDate={getMaxMajorDob()}
        />
        {errorValidate.dob && (
          <Form.Text className="text-danger">{errorValidate.dob}</Form.Text>
        )}
        {error.dob && (
          <Form.Text className="text-danger">{error.dob}</Form.Text>
        )}
        {!error.dob &&
          !errorValidate.dob &&
          formData.dob &&
          calculateAge(formData.dob) < 18 && (
            <Form.Text className="text-danger">
              Subscriber must be 18 years or older. Minor enrollment is not allowed.
            </Form.Text>
          )}

        <Form.Group controlId="formGender" className="form-group">
          <Form.Label className="form-label">Gender*:</Form.Label>
          <div className="d-flex flex-wrap" required>
            <Form.Check
              inline
              type="radio"
              label="Male"
              name="gender"
              id="genderMale"
              checked={formData.gender === "Male"}
              onChange={() => handleGenderChange("Male")}
              className="gender-option mx-2 "
              disabled={
                isminorDisabled ||
                (isSingapore ? false : (flag.gender ? false : formData.gender?.length))
              }
            />
            <Form.Check
              inline
              type="radio"
              label="Female"
              name="gender"
              id="genderFemale"
              checked={formData.gender === "Female"}
              onChange={() => handleGenderChange("Female")}
              className="gender-option mx-2 "
              disabled={
                isminorDisabled ||
                (isSingapore ? false : (flag.gender ? false : formData.gender?.length))
              }
            />
            <Form.Check
              inline
              type="radio"
              label="Prefer Not To Say"
              name="gender"
              id="genderOthers"
              checked={formData.gender === "Others"}
              onChange={() => handleGenderChange("Others")}
              className="gender-option mx-2 "
              disabled={
                isminorDisabled ||
                (isSingapore ? false : (flag.gender ? false : formData.gender?.length))
              }
            />
          </div>
          {errorValidate.gender && (
            <Form.Text className="text-danger">
              {errorValidate.gender}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group controlId="formEmail" className="form-group">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <Form.Label className="form-label mb-0">
              Email-ID*:{" "}
              {isEmailVerified ? (
                <span style={{ fontSize: "11px", color: "#28a745", fontWeight: "700", marginLeft: "6px" }}>
                  ✓ (Verified)
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: "600", marginLeft: "6px" }}>
                  (Unverified)
                </span>
              )}
            </Form.Label>
            {!isEmailVerified && (
              <button
                type="button"
                onClick={() => openOtpFor("email")}
                style={{
                  background: "#614119",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                Verify with OTP
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Form.Control
              type="email"
              placeholder="Enter email ID"
              className="form-control custom-placeholder"
              value={formData.email || savedEmail || ""}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              disabled={isminorDisabled || emailLocked || isEmailVerified}
              readOnly={emailLocked || isEmailVerified}
              style={(emailLocked || isEmailVerified)
                ? { backgroundColor: "#e9ecef", cursor: "not-allowed", color: "#495057" }
                : {}}
            />
            {isEmailVerified && !emailLocked && (
              <button
                type="button"
                onClick={() => setIsEmailVerified(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6c757d",
                  fontSize: "12px",
                  marginLeft: "8px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textDecoration: "underline",
                }}
                title="Change email"
              >
                Change
              </button>
            )}
          </div>
          {errorValidate.email && (
            <Form.Text className="text-danger">{errorValidate.email}</Form.Text>
          )}
        </Form.Group>

        <Form.Group className="  form-group" controlId="formAddress">
          <Form.Label className="form-label">Address*:</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={addressInput}
            onChange={handleAddressChange}
            onBlur={handleAddressBlur}
            minLength={5}
            style={{ minHeight: "70px", marginTop: "3px" }}
            maxLength={150}
            className="form-control custom-placeholder"
            placeholder="Enter the Address"
            ref={address1Ref}
            disabled={
              isminorDisabled ||
              // For Singapore: never lock by address content (area auto-fills it, user may still edit)
              (!isSingapore && (flag.address1 ? false : formData.address1?.trim().length)) ||
              newSubscriber || // Disable if data comes from Aadhar verification
              (selectedCustomerID && selectedCustomerID.Isaadharverified === 1) // Disable if customer is Aadhar verified
            }
          />


          <div
            className={`edit_add ${
              newSubscriber || selectedId === "minor" || selectedId === "new" || selectedOption === "withoutAadhar"
                ? "hidden"
                : ""
              }`}
          >
            {!newSubscriber && !(selectedCustomerID && selectedCustomerID.Isaadharverified === 1) && (
              <>
                {!isNewAddressMode && ( // Show Add New Address only when not in new address mode
                  <button className="styled-button1" onClick={handleAddressEdit}>
                    Add New Address
                  </button>
                )}
                {oldAddressData && isNewAddressMode && ( // Show Revert only when in new address mode and old data exists
                  <button
                    className="styled-button1"
                    onClick={handleRevertAddress}
                  >
                    Revert to Previous Address
                  </button>
                )}
              </>
            )}
          </div>

          {/* <div className={`edit_add ${newSubscriber ? "hidden" : ""}`}>
            {!newSubscriber && (
              <button className="styled-button1" onClick={handleAddressEdit}>
                Add New Address
              </button>
            )}
          </div> */}

          {errorValidate.address1 && (
            <Form.Text className="text-danger">
              {errorValidate.address1}
            </Form.Text>
          )}
        </Form.Group>

        {Boolean(formData.permanentAddress && formData.permanentAddress.trim()) && (
          <Form.Group className="form-group" controlId="formPermanentAddress">
            <Form.Label className="form-label">Permanent Address (Aadhaar):</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.permanentAddress || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prevFormData) => ({
                  ...prevFormData,
                  permanentAddress: val,
                }));
              }}
              minLength={5}
              style={{ minHeight: "70px", marginTop: "3px" }}
              maxLength={150}
              className="form-control custom-placeholder"
              placeholder="Permanent Address from Aadhaar"
              disabled
            />
          </Form.Group>
        )}
        <Row>
          <Col md={6}>
            <Form.Group controlId="formPinCode" className="form-group">
              <Form.Label className="form-label">{isSingapore ? "PO Code*:" : "Pin Code*:"}</Form.Label>
              <Form.Control
                type="text"
                placeholder={isSingapore ? "Enter 6-digit PO Code (e.g. 569933)" : "Enter pincode"}
                value={formData.pinCode}
                onChange={handlePinCodeChange}
                maxLength={6}
                className="form-control custom-placeholder"
                disabled={
                  isminorDisabled ||
                  (flag.pinCode
                    ? false
                    : formData.pinCode?.length &&
                    formData.state?.length &&
                    formData.area?.length &&
                    formData.city?.length)
                }
                inputMode="numeric"
                pattern="[0-9]*"

              // ref={pinCodeRef}
              />
              {errorValidate.pinCode && (
                <Form.Text className="text-danger">
                  {errorValidate.pinCode}
                </Form.Text>
              )}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="formCity" className="form-group">
              <Form.Label className="form-label">Area*: </Form.Label>
              <Form.Select
                key={formData.area || area}
                value={formData.area || area || ""}
                disabled={isSingapore ? false : Boolean(area)}
                onChange={(e) => handleAreaChange(e)}
              >
                {area ? (
                  <option value={area}>{area}</option>
                ) : (
                  <>
                    {" "}
                    <option value={""} hidden>Select the area</option>
                    {areaName?.map((e) => {
                      return (
                        <option value={e} key={e}>
                          {e}
                        </option>
                      );
                    })}
                  </>
                )}
              </Form.Select>
              {errorValidate.area && (
                <Form.Text className="text-danger">
                  {errorValidate.area}
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group controlId="formState" className="form-group">
              <Form.Label className="form-label">City*:</Form.Label>
              <Form.Control
                type="text"
                value={formData.city} // Automatically filled by API
                className="form-control"
                disabled

              // onFocus={handleFocusOnPinCode}
              />
              {errorValidate.city && (
                <Form.Text className="text-danger">
                  {errorValidate.city}
                </Form.Text>
              )}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="formState" className="form-group">
              <Form.Label className="form-label">State*:</Form.Label>
              <Form.Control
                type="text"
                value={formData.state} // Automatically filled by API
                className="form-control"
                disabled
                required
              />
              {errorValidate.state && (
                <Form.Text className="text-danger">
                  {errorValidate.state}
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>
      </Form>

      {/* Inside OTP Verification Modal */}
      <Modal
        show={showOtpModal}
        onHide={() => setShowOtpModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: "1px solid #dee2e6" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: "600", color: "#614119" }}>
            Verify {otpTarget === "mobile" ? "Mobile Number" : "Email Address"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          <p style={{ fontSize: "14px", color: "#495057", marginBottom: "15px" }}>
            An OTP has been sent to{" "}
            <strong>
              {otpTarget === "mobile"
                ? `${isSingapore ? "+65" : "+91"} ${formData.mobileNo}`
                : formData.email}
            </strong>
            . Please enter the OTP to verify.
          </p>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", marginBottom: "6px", display: "block" }}>
              Enter 6-Digit OTP:
            </label>
            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setEnteredOtp(val);
                if (otpModalError) setOtpModalError("");
              }}
              placeholder="e.g. 123456"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "18px",
                letterSpacing: "4px",
                textAlign: "center",
                border: otpModalError ? "1px solid #dc3545" : "1px solid #ced4da",
                borderRadius: "6px",
                outline: "none",
              }}
              autoFocus
            />
            {otpModalError && (
              <div style={{ color: "#dc3545", fontSize: "12px", marginTop: "6px" }}>
                {otpModalError}
              </div>
            )}
            <small style={{ color: "#6c757d", fontSize: "12px", display: "block", marginTop: "6px" }}>
              (Use test OTP: <strong>123456</strong>)
            </small>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => {
                toast.info("A new OTP (123456) has been resent.");
                setEnteredOtp("");
                setOtpModalError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#614119",
                fontSize: "13px",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Resend OTP
            </button>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da",
                  background: "#fff",
                  color: "#495057",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyInsideOtp}
                style={{
                  padding: "8px 18px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#614119",
                  color: "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Confirm & Verify
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};
export default Subscriberdetails;

