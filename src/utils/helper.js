const { DUMMYCOMPANIES } = require("../Constants/DummyCompanies");

exports.getDelay = (futureTime) => {
    try {
        // Parse the target date-time as UTC
        const targetDateTimeUTC = new Date(futureTime); // Ensure this is in ISO format
        const currentDateTimeUTC = new Date(); // The server's current time in UTC

        // Return the delay in milliseconds
        return targetDateTimeUTC - currentDateTimeUTC;
    } catch (error) {
        console.error('Error calculating delay:', error.message); // Log the error message only
        throw new Error('Unable to calculate delay.'); // Throw a generic error to avoid leaking sensitive info
    }
};

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
