// export const calculateAge = (dob) => {
//     return Math.abs(Date.now() - new Date(dob)) /  (1000 * 60 * 60*24*365)
// // }

export const calculateAge = (dob) => {
    if (!dob) return 0;
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
    if (isNaN(birthDate.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};