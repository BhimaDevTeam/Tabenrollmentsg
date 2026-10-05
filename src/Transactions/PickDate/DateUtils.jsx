export const calculateAge = (dob) => {
    if (!dob) return null;
    let birthDate = new Date(dob);
    if (isNaN(birthDate.getTime()) && typeof dob === "string") {
        const parts = dob.trim().split(/[-/]/);
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                birthDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            } else if (parts[0].length === 4) {
                birthDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
            }
        }
    }
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDisplayDob = (dateVal) => {
  if (!dateVal) return "—";
  const str = String(dateVal).trim();
  if (!str || str === "—") return "—";

  if (/^\d{1,2}\/[A-Za-z]{3}\/\d{4}$/.test(str)) {
    return str;
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    const day = isoMatch[3].padStart(2, "0");
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}/${MONTHS[monthIdx]}/${year}`;
    }
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const monthIdx = parseInt(dmyMatch[2], 10) - 1;
    const year = dmyMatch[3];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}/${MONTHS[monthIdx]}/${year}`;
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = MONTHS[d.getMonth()];
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  return str;
};