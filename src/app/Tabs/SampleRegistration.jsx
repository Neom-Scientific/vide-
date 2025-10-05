import React from 'react'

const SampleRegistration = () => {
    const testOptions = [
        "WES",
        "Carrier Screening",
        "CES",
        "Cardio Comprehensive (Screening)",
        "Cardio Metabolic Syndrome (Screening)",
        "WES + Mito",
        "CES + Mito",
        "HRR",
        "HCP",
        "Cardio Comprehensive Myopathy",
        "Myeloid",
        "SGS",
        "HLA"
    ];
    return (
        <div>
            <form>
                <label htmlFor="sample-name">Sample Name</label>
                <input
                    type="text"
                    id="sample-name"
                    placeholder="sample name"
                />
                <label htmlFor="test_type">Test Type</label>
                <select id="test_type" name="test_type">
                    <option value="">Select Test Type</option>
                    {testOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </form>
        </div>
    )
}

export default SampleRegistration