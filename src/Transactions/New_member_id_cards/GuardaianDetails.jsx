import React, { useState, useEffect } from 'react'
import { Form, Col, Row } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import PickDate from '../PickDate/PickDate';
import { calculateAge } from '../PickDate/DateUtils';
import { COLLECTION_API, SG_COLLECTION_API } from '../../apiurl';
import { useSelector } from 'react-redux';

const GUARDIAN_RELATIONSHIPS = [
  { ID: 97, Name: "Father" },
  { ID: 98, Name: "Mother" },
  { ID: 101, Name: "Brother" },
  { ID: 102, Name: "Sister" },
  { ID: 103, Name: "Brother" },
  { ID: 105, Name: "Other" },
  { ID: 106, Name: "Cousin" },
  { ID: 107, Name: "Uncle" },
  { ID: 108, Name: "Aunt" },
];

const GuardaianDetails = ({ guardianData, setGuardianData, errorValidate, clearError }) => {
  const data = useSelector(state => state?.customer);
  const [formData, setFormData] = useState(() => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem("guardaianData") || "{}");
    } catch (e) {
      stored = {};
    }
    const initialRel = guardianData?.guardrelationship !== undefined && guardianData?.guardrelationship !== null
      ? String(guardianData.guardrelationship)
      : (stored?.guardrelationship !== undefined && stored?.guardrelationship !== null ? String(stored.guardrelationship) : '');

    return {
      guardname: guardianData?.guardname || stored?.guardname || '',
      guardGender: guardianData?.guardGender || stored?.guardGender || '',
      guardrelationship: initialRel,
      guardrelationshipName: guardianData?.guardrelationshipName || stored?.guardrelationshipName || '',
      guarddob: guardianData?.guarddob || stored?.guarddob || '',
    };
  });

  const [errors, setErrors] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [relationships, setRelationships] = useState(GUARDIAN_RELATIONSHIPS);
  const [storeObj, setStoreObj] = useState({});

  const fetchRelationships = async () => {
    try {
      const apiUrl = SG_COLLECTION_API || COLLECTION_API;
      const response = await fetch(`${apiUrl}/guardiandetails`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const responseData = await response.json();

      if (Array.isArray(responseData) && responseData.length > 0) {
        setRelationships(responseData);
      } else {
        setRelationships(GUARDIAN_RELATIONSHIPS);
      }
    } catch (error) {
      console.warn('Error fetching relationships:', error);
      setRelationships(GUARDIAN_RELATIONSHIPS);
    }
  };

  useEffect(() => {
    if (Array.isArray(data?.customer)) {
      const isMajor = (user) => {
        if (!user) return false;
        if (user.IsAdult === true || user.IsAdult === "true" || user.major === "Y" || user.isMajor === "Y" || user.isMajor === true) return true;
        if (user.IsAdult === false || user.IsAdult === "false" || user.major === "N" || user.isMajor === "N" || user.isMajor === false) return false;
        const d = user.DateOfBirth || user.DateOf_Birth || user.dob || user.DOB;
        if (!d) return false;
        const a = calculateAge(d);
        return a !== null && !isNaN(a) && a >= 18;
      };
      const majorObject = data?.customer?.find(e => isMajor(e));
      
      const genderMap = {
        M: "Male",
        F: "Female",
        O: "Others",
      };
      if (majorObject) {
        const { Name, Aadharname, Sex, Gender, DateOfBirth } = majorObject;
        const mappedGender = genderMap[Sex] || genderMap[Gender] || (Gender === "Male" || Gender === "Female" ? Gender : "") || "";
        const obj = {
          guardname: Name || Aadharname || "",
          guardGender: mappedGender,
          guarddob: DateOfBirth || "",
        };
        setIsEdit(true);
        setFormData(prev => ({
          ...prev,
          guardname: prev.guardname || obj.guardname,
          guardGender: prev.guardGender || obj.guardGender,
          guarddob: prev.guarddob || obj.guarddob,
        }));
        setStoreObj(obj);
      } else {
        setStoreObj({});
      }
    }
    fetchRelationships();
  }, [data?.customer]);

  useEffect(() => {
    setGuardianData(formData);
  }, [formData, setGuardianData]);

  const getMaxGuardianDob = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleGuardGenderChange = (event) => {
    const selectedValue = event.target.value;
    setFormData((prevFormData) => ({ ...prevFormData, guardGender: selectedValue }));
    clearError('guardGender');
  };

  const handleDateChange = (newDate) => {
    setFormData((prevFormData) => ({ ...prevFormData, guarddob: newDate }));
    if (!newDate) {
      if (errorValidate) errorValidate.guarddob = 'Guardian DOB is required.';
    } else {
      const age = calculateAge(newDate);
      if (age !== null && age <= 18) {
        if (errorValidate) errorValidate.guarddob = 'Guardian age should be greater than 18.';
      } else {
        clearError('guarddob');
      }
    }
  };

  useEffect(() => {
    if (formData.guarddob) {
      const age = calculateAge(formData.guarddob);
      if (age !== null && age <= 18) {
        if (errorValidate) errorValidate.guarddob = 'Guardian age should be greater than 18.';
      } else if (age !== null && age > 18) {
        clearError('guarddob');
      }
    }
  }, [formData.guarddob, errorValidate, clearError]);

  return (
    <div className='container'>
      <Form className="form">
        <p>kyc document is to be furnished </p>
        <Row className="mb-3">
          <Col md={7}>
            <Form.Group controlId="formGuardName" className="form-group">
              <Form.Label className="form-label"> Name*:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Guardian Name"
                name="guardname"
                value={formData.guardname}
                onChange={(e) => {
                  const value = e.target.value;
                  const upperCaseValue = value.toUpperCase(); // Convert to uppercase
                  // Allow only alphabetic characters and spaces
                  if (/^[a-zA-Z\s]*$/.test(upperCaseValue)) {
                    setFormData(prev => ({ ...prev, guardname: upperCaseValue }));
                    clearError('guardname');
                  }
                }}
                className="form-control custom-placeholder"
                required
              />
              {errorValidate.guardname && <Form.Text className="text-danger">{errorValidate.guardname}</Form.Text>}
            </Form.Group>
          </Col>

          <Col md={5}>
            <Form.Group controlId="formGuardrelationship" className="form-group">
              <Form.Label className="form-label">Relationship*:</Form.Label>
              <Form.Select
                name="guardrelationship"
                className="form-control custom-placeholder"
                value={formData.guardrelationship ? String(formData.guardrelationship) : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const selectedRel = relationships.find(r => String(r.ID) === String(value));
                  setFormData(prev => ({
                    ...prev,
                    guardrelationship: value,
                    guardrelationshipName: selectedRel ? selectedRel.Name : "",
                  }));
                  if (value) {
                    clearError('guardrelationship');
                  }
                }}
              >
                <option value="" hidden>
                  Select a relationship
                </option> 
                {relationships.map((relationship, index) => (
                  <option key={`${relationship.ID}-${index}`} value={relationship.ID}>
                    {relationship.Name}
                  </option>
                ))}
              </Form.Select>
              {errorValidate.guardrelationship && <Form.Text className="text-danger">{errorValidate.guardrelationship}</Form.Text>}
            </Form.Group>
          </Col>

          <Form.Group controlId="formGender" className="form-group">
            <Form.Label className="form-label"> Gender*:</Form.Label>
            <div className="d-flex flex-wrap" required >
              <div className="gender-option mx-2 ">
                <Form.Check
                  inline
                  type="radio"
                  label="Male"
                  name="guardGender"
                  id="genderMale"
                  value="Male"
                  checked={formData.guardGender === "Male"}
                  onChange={handleGuardGenderChange}
                />
              </div>
              <div className="gender-option mx-2 ">
                <Form.Check
                  inline
                  type="radio"
                  label="Female"
                  name="guardGender"
                  id="genderFemale"
                  value="Female"
                  checked={formData.guardGender === "Female"}
                  onChange={handleGuardGenderChange}
                />
              </div>
              <div className="gender-option mx-2 ">
                <Form.Check
                  inline
                  type="radio"
                  label="Prefer Not To Say"
                  name="guardGender"
                  id="genderOthers"
                  value="Others"
                  checked={formData.guardGender === "Others"}
                  onChange={handleGuardGenderChange}
                />
              </div>
            </div>
            {errorValidate.guardGender && <Form.Text className="text-danger">{errorValidate.guardGender}</Form.Text>}
          </Form.Group>

          <Form.Group controlId="formGuardianDob">
            <PickDate
              dob={formData.guarddob}
              onDateChange={handleDateChange}
              label="Guardian DOB*:"
              disabled={false}
              maxDate={getMaxGuardianDob()}
            />
            {errorValidate.guarddob && <Form.Text className="text-danger">{errorValidate.guarddob}</Form.Text>}
          </Form.Group>
        </Row>
      </Form>
    </div>
  )
}

export default GuardaianDetails