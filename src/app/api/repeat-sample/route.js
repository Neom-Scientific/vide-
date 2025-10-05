import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

// List all fields from SampleRegistration.jsx here
const sampleRegistrationFields = [
    "sample_id", "hospital_name", "hospital_id", "doctor_name", "dept_name", "doctor_mobile", "email",
    "patient_name", "DOB", "age", "gender", "patient_mobile", "ethnicity", "father_mother_name", "address",
    "city", "state", "country", "client_id", "client_name", "spouse_name", "patient_email", "registration_date", "sample_type", "collection_date_time", "sample_date",
    "specimen_quality", "prority", "storage_condition", "vial_received", "test_name",
    "systolic_bp", "diastolic_bp", "total_cholesterol", "hdl_cholesterol", "ldl_cholesterol", "diabetes",
    "smoker", "hypertension_treatment", "statin", "aspirin_therapy", "remarks", "clinical_history", "trf"
];

const dateFields = [
    "DOB", "collection_date_time", "sample_date", "created_at", "updated_at", "seq_run_date", "report_realising_date", "registration_date", "lib_prep_date"
    // add any other date columns here
];

const integerFields = [
    "age", "systolic_bp", "diastolic_bp", "total_cholesterol", "hdl_cholesterol", "ldl_cholesterol",
    "tat_days", "gb_per_sample", "total_gb_available", "total_required", "total_volume_next_seq_550",
    "count"
];

// List all pool_info and run_setup columns here
const poolFields = [
    "conc_rxn", "i5_index_reverse", "i7_index", "lib_qubit", "nm_conc", "nfw_volu_for_20nm",
    "total_vol_for_20nm", "barcode", "lib_vol_for_20nm", "sample_id", "test_name", "qubit_dna",
    "per_rxn_gdna", "volume", "gdna_volume_3x", "nfw", "plate_designation", "well",
    "qubit_lib_qc_ng_ul", "stock_ng_ul", "lib_vol_for_hyb", "gb_per_sample", "pool_no", "size",
    "i5_index_forward", "sample_volume", "pooling_volume", "pool_conc", "one_tenth_of_nm_conc",
    "data_required", "hospital_name", "run_id", "lib_prep_date", "internal_id", "batch_id",
    "vol_for_40nm_percent_pooling", "volume_from_40nm_for_total_25ul_pool", "done_by","tapestation_size","tapestation_conc","dna_vol_for_dilution","buffer_vol_to_be_added","conc_of_amplicons","vol_for_fragmentation", "lib_qubit_for_2nm","size_for_2nm", "nfw_vol_for_2nm", "lib_vol_for_2nm", "total_vol_for_2nm","nm_conc_for_2nm"
];

const runSetupFields = ["buffer_volume_next_seq_550", "dinatured_lib_next_seq_550",
    "final_pool_conc_vol_2nm_next_seq_1000_2000", "instument_type",
    "lib_required_next_seq_550", "loading_conc_550", "loading_conc_1000_2000", "nm_cal",
    "pool_conc_run_setup", "pool_size", "rsbetween_vol_2nm_next_seq_1000_2000",
    "selected_application", "seq_run_date", "total_gb_available", "total_required",
    "total_volume_2nm_next_seq_1000_2000", "total_volume_600pm_next_seq_1000_2000",
    "total_volume_next_seq_550", "vol_of_2nm_for_600pm_next_seq_1000_2000",
    "vol_of_rs_between_for_600pm_next_seq_1000_2000", "total_volume_2nm_next_seq_550",
    "final_pool_conc_vol_2nm_next_seq_550", "nfw_vol_2nm_next_seq_550", "count",
    "final_pool_vol_ul", "table_data", "ht_buffer_next_seq_1000_2000", "run_remarks"]

const floatFields = [
    "pool_conc", "one_tenth_of_nm_conc", "lib_vol_for_20nm", "nfw_volu_for_20nm",
    "total_vol_for_20nm", "lib_vol_for_hyb", "data_required", "sample_volume",
    "pooling_volume", "buffer_volume_next_seq_550", "dinatured_lib_next_seq_550",
    "lib_required_next_seq_550", "loading_conc_1000_2000", "total_volume_2nm_next_seq_550",
    "final_pool_vol_ul", "ht_buffer_next_seq_1000_2000", "vol_for_40nm_percent_pooling",
    "volume_from_40nm_for_total_25ul_pool", "final_pool_conc_vol_2nm_next_seq_1000_2000",
    "loading_conc_550","tapestation_size","tapestation_conc",
    "nm_cal",
    "pool_size",
    "pool_conc_run_setup",
    "rsbetween_vol_2nm_next_seq_1000_2000",
    "total_volume_2nm_next_seq_1000_2000",
    "total_volume_600pm_next_seq_1000_2000",
    "vol_of_2nm_for_600pm_next_seq_1000_2000",
    "vol_of_rs_between_for_600pm_next_seq_1000_2000",
    "final_pool_conc_vol_2nm_next_seq_550",
    "nfw_vol_2nm_next_seq_550", "final_pool_conc_vol_2nm_next_seq_1000_2000","dna_vol_for_dilution","buffer_vol_to_be_added","conc_of_amplicons","vol_for_fragmentation"
    // Add any other float/double columns in your schema
];

const jsonFields = ['table_data']

// Helper to generate new internal_id (YYYYNNNNN)
async function generateInternalId(test_name , sample_type) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const year = new Date().getFullYear();

        if (test_name === "Myeloid") {
            // Find the max numeric part for this year from the whole table
            const maxInternalIdQuery = `
                SELECT MAX(CAST(SUBSTRING(CAST(internal_id AS TEXT), 5, 5) AS INTEGER)) AS max_seq
                FROM master_sheet
                WHERE LEFT(CAST(internal_id AS TEXT), 4) = $1
            `;
            const maxInternalIdResult = await client.query(maxInternalIdQuery, [String(year)]);
            const maxSeq = maxInternalIdResult.rows[0]?.max_seq || 0;
            const nextSeq = maxSeq + 1;
            const numericPart = `${year}${String(nextSeq).padStart(5, '0')}`;
            const newId = `${numericPart}-${sample_type}`;
            // Double-check uniqueness
            const { rows: check } = await client.query(`SELECT 1 FROM master_sheet WHERE internal_id = $1`, [newId]);
            if (check.length > 0) throw new Error(`internal_id ${newId} already exists`);
            await client.query('COMMIT');
            return newId;
        } else {
            // Default logic for other test_names
            const maxInternalIdQuery = `
                SELECT MAX(CAST(SUBSTRING(CAST(internal_id AS TEXT), 5, 5) AS INTEGER)) AS max_seq
                FROM master_sheet
                WHERE LEFT(CAST(internal_id AS TEXT), 4) = $1
            `;
            const maxInternalIdResult = await client.query(maxInternalIdQuery, [String(year)]);
            const maxSeq = maxInternalIdResult.rows[0]?.max_seq || 0;
            const nextSeq = maxSeq + 1;
            const newId = `${year}${String(nextSeq).padStart(5, "0")}`;
            // Double-check uniqueness
            const { rows: check } = await client.query(`SELECT 1 FROM master_sheet WHERE internal_id = $1`, [newId]);
            if (check.length > 0) throw new Error(`internal_id ${newId} already exists`);
            await client.query('COMMIT');
            return newId;
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}


export async function POST(request) {
    const body = await request.json();
    const { sample_id, repeat_type, user_email, comments } = body;
    let response = [];

    try {
        // Fetch the original sample
        const { rows } = await pool.query(
            `SELECT * FROM master_sheet WHERE sample_id = $1 ORDER BY registration_date DESC LIMIT 1`,
            [sample_id]
        );
        if (rows.length === 0) {
            response.push({ status: 404, message: "Sample not found" });
            return NextResponse.json(response);
        }
        const original = rows[0];

        let newSample = {};

        // Always copy SampleRegistration fields
        sampleRegistrationFields.forEach(field => {
            let value = original[field];
            if (dateFields.includes(field)) {
                newSample[field] = value ? value : null;
            } else if (integerFields.includes(field)) {
                newSample[field] = (value === "" || value === null || value === undefined) ? null : Number(value);
            } else if (floatFields.includes(field)) {
                newSample[field] = (value === "" || value === null || value === undefined) ? null : parseFloat(value);
            } else {
                newSample[field] = value ?? "";
            }
        });

        if (repeat_type === "repeat_from_library") {
            // Keep internal_id, pool_no, batch_id
            newSample.internal_id = await generateInternalId(newSample.test_name, newSample.sample_type);
            newSample.reference_internal_id = original.internal_id;
            newSample.dna_isolation = "Yes";
            newSample.lib_prep = "Yes";
            newSample.is_repeated = "True";
            newSample.pool_no = null
            newSample.batch_id = null;
            newSample.run_id = null;
            newSample.reference_id = original.id;
            // Reset all pool_info/run_setup fields except those above
            poolFields.forEach(field => {
                if (!["internal_id", "pool_no", "batch_id", "test_name", "sample_id"].includes(field)) {
                    if (floatFields.includes(field)) {
                        newSample[field] = null;
                    } else if (integerFields.includes(field)) {
                        newSample[field] = null;
                    } else if (dateFields.includes(field)) {
                        newSample[field] = null;
                    } else {
                        if (floatFields.includes(field)) {
                            newSample[field] = null;
                        } else {
                            newSample[field] = "";
                        }
                    }
                }
            });

            // Empty all runSetupFields
            runSetupFields.forEach(field => {
                if (floatFields.includes(field) || integerFields.includes(field) || dateFields.includes(field)) {
                    newSample[field] = null;
                } else {
                    newSample[field] = "";
                }
            });
            await pool.query(`UPDATE master_sheet SET is_repeated = 'True' WHERE internal_id = $1`, [original.internal_id]);
        } else if (repeat_type === "repeat_from_sequencing") {
            // Generate new internal_id, pool_no, batch_id
            newSample.internal_id = await generateInternalId(newSample.test_name, newSample.sample_type);
            newSample.reference_internal_id = original.internal_id;
            newSample.pool_no = null;
            newSample.batch_id = null;
            newSample.dna_isolation = "Yes";
            newSample.lib_prep = "Yes";
            newSample.is_repeated = "True";
            newSample.run_id = null;
            newSample.reference_id = original.id;
            console.log('newsample.internal_id', newSample.internal_id);

            // Only empty the specified columns, copy others from original
            const emptyFields = [
                "lib_vol_for_hyb", "data_required", "pool_conc", "size", "nm_conc",
                "one_tenth_of_nm_conc", "lib_vol_for_20nm", "nfw_volu_for_20nm", "total_vol_for_20nm"
            ];

            poolFields.forEach(field => {
                if (field === "internal_id") {
                    return; // 🔒 Don't overwrite generated internal_id
                }
                if (["pool_no", "batch_id"].includes(field)) {
                    newSample[field] = null;
                    return;
                }
                if (emptyFields.includes(field)) {
                    if (floatFields.includes(field) || integerFields.includes(field) || dateFields.includes(field)) {
                        newSample[field] = null;
                    } else {
                        newSample[field] = "";
                    }
                } else {
                    let value = original[field];
                    if (dateFields.includes(field)) {
                        newSample[field] = value ? value : null;
                    } else if (integerFields.includes(field)) {
                        newSample[field] = (value === "" || value === null || value === undefined) ? null : Number(value);
                    } else if (floatFields.includes(field)) {
                        newSample[field] = (value === "" || value === null || value === undefined) ? null : parseFloat(value);
                    } else {
                        newSample[field] = value ?? "";
                    }
                }
                if (repeat_type === "repeat_from_sequencing") {
                    if (emptyFields.includes(field)) {
                        if (floatFields.includes(field) || integerFields.includes(field) || dateFields.includes(field)) {
                            newSample[field] = null;
                        } else {
                            newSample[field] = "";
                        }
                    } else {
                        let value = original[field];
                        if (dateFields.includes(field)) {
                            newSample[field] = value ? value : null;
                        } else if (integerFields.includes(field)) {
                            newSample[field] = (value === "" || value === null || value === undefined) ? null : Number(value);
                        } else if (floatFields.includes(field)) {
                            newSample[field] = (value === "" || value === null || value === undefined) ? null : parseFloat(value);
                        } else {
                            newSample[field] = value ?? "";
                        }
                    }
                }

            });

            // Empty all runSetupFields
            runSetupFields.forEach(field => {
                if (floatFields.includes(field) || integerFields.includes(field) || dateFields.includes(field)) {
                    newSample[field] = null;
                } else {
                    newSample[field] = "";
                }
            });
            await pool.query(`UPDATE master_sheet SET dna_isolation = 'Yes' , lib_prep = 'Yes' , location = 'repeat' WHERE internal_id = $1`, [newSample.internal_id]);
            await pool.query(`UPDATE master_sheet SET is_repeated = 'True' WHERE internal_id = $1`, [original.internal_id]);
        }
        else if (repeat_type === "repeat_from_extraction") {
            newSample.internal_id = await generateInternalId(newSample.test_name, newSample.sample_type);
            newSample.reference_internal_id = original.internal_id;
            newSample.dna_isolation = "No";
            newSample.lib_prep = "No";
            newSample.is_repeated = "True";
            newSample.pool_no = null
            newSample.batch_id = null;
            newSample.run_id = null;
            newSample.reference_id = original.id;

            poolFields.forEach(field => {
                if (floatFields.includes(field)) {
                    newSample[field] = null;
                } else if (integerFields.includes(field)) {
                    newSample[field] = null;
                } else if (dateFields.includes(field)) {
                    newSample[field] = null;
                } else {
                    if (floatFields.includes(field)) {
                        newSample[field] = null;
                    } else {
                        newSample[field] = "";
                    }
                }
            });

            // Empty all runSetupFields
            runSetupFields.forEach(field => {
                if (floatFields.includes(field) || integerFields.includes(field) || dateFields.includes(field)) {
                    newSample[field] = null;
                } else {
                    newSample[field] = "";
                }
            });
            await pool.query(`UPDATE master_sheet SET is_repeated = 'True' WHERE internal_id = $1`, [original.internal_id]);
        }
        else {
            response.push({ status: 400, message: "Invalid repeat type" });
            return NextResponse.json(response);
        }

        // Remove id, created_at, updated_at if present
        delete newSample.id;
        delete newSample.created_at;
        delete newSample.updated_at;

        // Convert all "" to null for numeric fields before insert
        floatFields.forEach(field => {
            if (!(field in newSample) || newSample[field] === "" || newSample[field] === undefined) {
                newSample[field] = null;
            }
        });
        integerFields.forEach(field => {
            if (!(field in newSample) || newSample[field] === "" || newSample[field] === undefined) {
                newSample[field] = null;
            }
        });
        jsonFields.forEach(field => {
            if (!(field in newSample) || newSample[field] === "" || newSample[field] === undefined) {
                newSample[field] = null;
            }
        });

        // Now build columns, values, placeholders as before
        const columns = Object.keys(newSample);
        const values = columns.map((col) => newSample[col]);
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(", ");

        const insertQuery = `
      INSERT INTO master_sheet (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;

        console.log("Insert Query:", insertQuery);
        console.log("Values:", values);
        const insertResult = await pool.query(insertQuery, values);

        // Optionally, add audit log
        await pool.query(
            `INSERT INTO audit_logs (sample_id, comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, $4, $5)`,
            [
                newSample.sample_id,
                `Repeat sample created because of ${comments}`,
                user_email,
                new Date(),
                newSample.hospital_name
            ]
        );

        response.push({
            status: 200,
            message: "Repeat sample created",
            internal_id: newSample.internal_id,
            data: insertResult.rows[0],
        });
        return NextResponse.json(response);
    } catch (err) {
        console.error(err);
        response.push({ status: 500, message: "Server error" });
        return NextResponse.json(response);
    }
}