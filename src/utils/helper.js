const { DUMMYCOMPANIES } = require("../Constants/DummyCompanies");

exports.getDelay = (futureTime) =>{

    // Parse the target date-time as UTC
    const targetDateTimeUTC = new Date(futureTime); // Ensure this is in ISO format
    console.log('Converted local time to UTC==>  '+targetDateTimeUTC)
    const currentDateTimeUTC = new Date(); // The server's current time in UTC
    console.log('Current time in UTC==>  '+currentDateTimeUTC)

    return targetDateTimeUTC - currentDateTimeUTC;
}

exports.dummyCompaniesForUnauthorizedUser = () =>{
    const dummyCompanies = DUMMYCOMPANIES.map((company, i) =>{
        const newDate = new Date();

        return {
            ...company,
            maildroptime : newDate.setHours(newDate.getHours() + (i * 5))
        }
    })

    return dummyCompanies;
}