const { DUMMYCOMPANIES } = require("../Constants/DummyCompanies");

exports.dummyCompaniesForUnauthorizedUser = () => {
    try {
        const dummyCompanies = DUMMYCOMPANIES.map((company, i) => {
            const newDate = new Date();
            newDate.setHours(newDate.getHours() + (i * 5)); // Increment hours by 5 for each company

            return {
                ...company,
                maildroptime: newDate, // Set the calculated date
            };
        });

        return dummyCompanies;
    } catch (error) {
        console.error('Error generating dummy companies:', error.message); // Log the error message only
        throw new Error('Unable to generate dummy companies.'); // Throw a generic error to avoid leaking sensitive info
    }
};
