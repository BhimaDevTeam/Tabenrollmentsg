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