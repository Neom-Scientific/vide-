import { pool } from "@/lib/db";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const config = {
    api: {
        bodyParser: false
    }
}

export async function POST(request) {
    const formData = await request.formData();
    const fields = {};
    for (const [key, value] of formData.entries()) {
        if (key !== "file") fields[key] = value;
    }
    const file = formData.get("file");

    try {
        let response = [];
        const {
            hospital_name,
            dept_name,
            vial_received,
            specimen_quality,
            registration_date,
            sample_date,
            sample_type,
            trf,
            collection_date_time,
            storage_condition,
            prority,
            hospital_id,
            client_id,
            client_name,
            sample_id,
            patient_name,
            DOB,
            age,
            gender,
            ethnicity,
            father_mother_name,
            spouse_name,
            address,
            city,
            state,
            country,
            patient_mobile,
            doctor_mobile,
            doctor_name,
            email,
            remarks,
            clinical_history,
            repeat_required,
            repeat_reason,
            repeat_date,
            selectedTestName,
            systolic_bp,
            diastolic_bp,
            total_cholesterol,
            hdl_cholesterol,
            ldl_cholesterol,
            diabetes,
            smoker,
            hypertension_treatment,
            statin,
            aspirin_therapy,
            tantive_report_date,
            patient_email,
            trf_checkbox,
            opd_notes_checkbox,
            consent_form_checkbox,
        } = fields;
        let hpo_id_final = null;
        let hpo_term_final = null;
        // if (clinical_history) {
        //     try {
        //         const resp = await fetch("https://hpoidextractor.onrender.com/extract", {
        //             method: "POST",
        //             headers: { "Content-Type": "application/json" },
        //             body: JSON.stringify({ text: clinical_history }),
        //         });

        //         if (resp.ok) {
        //             const data = await resp.json();
        //             if (Array.isArray(data) && data.length > 0) {
        //                 const hpoIds = data.map((d) => d["HPO ID"] || d.hpo_id).filter(Boolean);
        //                 const hpoTerms = data.map((d) => d["Term"] || d.hpo_term).filter(Boolean);

        //                 hpo_id_final = hpoIds.length > 0 ? hpoIds.join(", ") : "Not Found";
        //                 hpo_term_final = hpoTerms.length > 0 ? hpoTerms.join(", ") : "Not Found";
        //             } else {
        //                 hpo_id_final = "Not Found";
        //                 hpo_term_final = "Not Found";
        //             }
        //         } else {
        //             console.error("FastAPI error:", await resp.text());
        //             hpo_id_final = "Not Found";
        //             hpo_term_final = "Not Found";
        //         }
        //     } catch (err) {
        //         console.error("Failed to call extractor:", err);
        //         hpo_id_final = "Not Found";
        //         hpo_term_final = "Not Found";
        //     }
        // }
        const testNames = (selectedTestName || "").split(",").map(t => t.trim()).filter(Boolean);
        console.log('testNames', testNames);
        const today = new Date(registration_date || Date.now());
        const todayStr = today.toISOString().slice(0, 10);

        // Check if a project_id already exists for the hospital_name on the same day
        const existingProjectIdQuery = `
            SELECT project_id FROM master_sheet
            WHERE registration_date::date = $1 AND hospital_name = $2
            LIMIT 1
        `;
        const existingProjectIdResult = await pool.query(existingProjectIdQuery, [todayStr, hospital_name]);

        let project_id;
        if (existingProjectIdResult.rows.length > 0) {
            // Use the existing project_id
            project_id = existingProjectIdResult.rows[0].project_id;
        } else {
            // Generate a new project_id sequence
            const seqQuery = `
            SELECT project_id FROM master_sheet
            ORDER BY project_id DESC
            LIMIT 1
            `;
            const seqResult = await pool.query(seqQuery);
            let nextSeq = 1;
            if (seqResult.rows.length > 0 && seqResult.rows[0].project_id) {
                // Extract the numeric part and increment
                const lastSeq = parseInt(seqResult.rows[0].project_id.replace("PI", ""), 10);
                nextSeq = lastSeq + 1;
            }
            project_id = `PI${String(nextSeq).padStart(4, "0")}`;
        }

        if (testNames.length === 1) {
            const formatRes = await pool.query(
                `SELECT * FROM id_format WHERE hospital_name = $1`,
                [hospital_name]
            );
            const format = formatRes.rows[0];

            const now = new Date();
            const currentYear = String(now.getFullYear());
            const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

            // let internal_id;
            // if (format.internal_id_pad_length && format.internal_id_prefix === '' && format.internal_id_separator === '') {
            //     let nextSeq = format.internal_id_last_seq + 1;
            //     if (format.internal_id_last_year !== currentYear || format.internal_id_last_month !== currentMonth) {
            //         nextSeq = 1;
            //     }
            //     internal_id = `${currentYear}${currentMonth}${String(nextSeq).padStart(format.internal_id_pad_length, '0')}`;
            //     await pool.query(
            //         `UPDATE id_format SET internal_id_last_seq = $1, internal_id_last_year = $2, internal_id_last_month = $3 WHERE hospital_name = $4`,
            //         [nextSeq, currentYear, currentMonth, hospital_name]
            //     );
            // } else {
            //     const idFormatQuery = `
            //         SELECT internal_id_prefix, internal_id_separator, internal_id_pad_length, internal_id_last_seq
            //         FROM id_format
            //         WHERE hospital_name = $1
            //         LIMIT 1
            //     `;
            //     const idFormatResult = await pool.query(idFormatQuery, [hospital_name]);
            //     if (idFormatResult.rows.length === 0) {
            //         throw new Error("ID format not found for hospital");
            //     }
            //     const {
            //         internal_id_prefix,
            //         internal_id_separator,
            //         internal_id_pad_length,
            //         internal_id_last_seq
            //     } = idFormatResult.rows[0];

            //     if (selectedTestName === "Myeloid") {
            //         const existing = await pool.query(
            //             `SELECT internal_id FROM master_sheet WHERE sample_id = $1 AND test_name = $2 AND hospital_name = $3`,
            //             [sample_id, "Myeloid", hospital_name]
            //         );

            //         if (existing.rows.length > 0) {
            //             const existingInternalId = existing.rows[0].internal_id;
            //             const lastSepIndex = Math.max(
            //                 existingInternalId.lastIndexOf('-'),
            //                 existingInternalId.lastIndexOf('_')
            //             );
            //             const numericPart = lastSepIndex !== -1
            //                 ? existingInternalId.substring(0, lastSepIndex)
            //                 : existingInternalId;
            //             internal_id = `${numericPart}-${sample_type}`;
            //         } else {
            //             const nextSeq = Number(internal_id_last_seq) + 1;
            //             const updateSeqQuery = `
            //                 UPDATE id_format
            //                 SET internal_id_last_seq = $1
            //                 WHERE hospital_name = $2
            //             `;
            //             await pool.query(updateSeqQuery, [nextSeq, hospital_name]);
            //             const paddedSeq = String(nextSeq).padStart(Number(internal_id_pad_length), "0");
            //             const numericPart = `${internal_id_prefix}${internal_id_separator || ""}${paddedSeq}`;
            //             internal_id = `${numericPart}-${sample_type}`;
            //         }
            //     } else {
            //         const nextSeq = Number(internal_id_last_seq) + 1;
            //         const updateSeqQuery = `
            //             UPDATE id_format
            //             SET internal_id_last_seq = $1
            //             WHERE hospital_name = $2
            //         `;
            //         await pool.query(updateSeqQuery, [nextSeq, hospital_name]);
            //         const paddedSeq = String(nextSeq).padStart(Number(internal_id_pad_length), "0");
            //         internal_id = `${internal_id_prefix}${internal_id_separator || ""}${paddedSeq}`;
            //     }
            // }

            let internal_id = 'sample_1'
            // make the internal_id something like sample_1, sample_2 etc for each hospital and if the testName = "Myeloid" then append the sample_type to the internal_id like sample_1-DNA or sample_1-RNA
            // make the internal_id unique for each hospital
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM master_sheet WHERE hospital_name = $1`,
                [hospital_name]
            );
            const count = parseInt(countResult.rows[0].count, 10) || 0;
            internal_id = `sample_${count + 1}`;
            if (selectedTestName === "Myeloid") {
                const existing = await pool.query(
                    `SELECT internal_id FROM master_sheet WHERE sample_id = $1 AND test_name = $2 AND hospital_name = $3`,
                    [sample_id, "Myeloid", hospital_name]
                );
                if (existing.rows.length > 0) {
                    // Extract base part (before first '-' or '_') and append DNA/RNA suffix
                    const baseInternal = String(existing.rows[0].internal_id).split(/[-]/)[0];
                    console.log('baseInternal', baseInternal);
                    // Determine suffix — favor 'RNA' if sample_type mentions 'rna', otherwise 'DNA'
                    const suffix = /rna/i.test(String(sample_type || '')) ? 'RNA' : 'DNA';
                    internal_id = `${baseInternal}-${suffix}`;
                } else {
                    internal_id = `${internal_id}-${sample_type}`;
                }
            }

            // don't want to update the id_format table

            console.log('internal_id', internal_id);

            let trf_file_id = null;
            if (file && typeof file.arrayBuffer === "function") {
                const fileBuffer = Buffer.from(await file.arrayBuffer());
                const auth = new google.auth.GoogleAuth({
                    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
                    scopes: ["https://www.googleapis.com/auth/drive"],
                });
                const drive = google.drive({ version: "v3", auth });
                const response = await drive.files.create({
                    requestBody: {
                        name: internal_id, // Use internal_id as file name
                        parents: ["1xzTkB-k3PxEbGpvj4yoHXxBFgAtCLz1p"], // Your folder ID
                    },
                    media: {
                        mimeType: file.type,
                        body: Readable.from(fileBuffer),
                    },
                    supportsAllDrives: true,
                    driveId: "0AGcjkp59qA5iUk9PVA", // Your shared drive ID
                });
                // console.log('response.data', response.data);
                trf_file_id = response.data.id;
            }

            const query = `
                INSERT INTO master_sheet (
                    hospital_name,
                    dept_name,
                    vial_received,
                    specimen_quality,
                    registration_date,
                    sample_date,
                    sample_type,
                    trf,
                    collection_date_time,
                    storage_condition,
                    prority,
                    hospital_id,
                    client_id,
                    client_name,
                    sample_id,
                    patient_name,
                    DOB,
                    age,
                    gender,
                    ethnicity,
                    father_mother_name,
                    spouse_name,
                    address,
                    city,
                    state,
                    country,
                    patient_mobile,
                    doctor_mobile,
                    doctor_name,
                    email,
                    test_name,
                    remarks,
                    clinical_history,
                    repeat_required,
                    repeat_reason,
                    repeat_date,
                    internal_id,
                    systolic_bp,
                    diastolic_bp,
                    total_cholesterol,
                    hdl_cholesterol,
                    ldl_cholesterol,
                    diabetes,
                    smoker,
                    hypertension_treatment,
                    statin,
                    aspirin_therapy,
                    dna_isolation,
                    lib_prep,
                    under_seq,
                    seq_completed,
                    tantive_report_date,
                    hpo_status,
                    annotation,
                    project_id,
                    patient_email,
                    sample_status,
                    location,
                    trf_checkbox,
                    opd_notes_checkbox,
                    consent_form_checkbox,
                    hpo_id,
                    hpo_term
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23, $24, $25,
                    $26, $27, $28, $29, $30,
                    $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                    $41, $42, $43, $44, $45, $46,$47, $48,
                    $49, $50, $51, $52, $53, $54, $55, $56, $57,$58, $59,$60,$61,$62 ,$63
                )
                RETURNING *
            `;
            const values = [
                hospital_name,
                dept_name || null,
                vial_received,
                specimen_quality,
                registration_date || null,
                sample_date || null,
                sample_type,
                trf_file_id || null,
                collection_date_time || null,
                storage_condition,
                prority,
                hospital_id,
                client_id,
                client_name,
                sample_id,
                patient_name,
                DOB || null,
                age,
                gender,
                ethnicity,
                father_mother_name,
                spouse_name,
                address,
                city,
                state,
                country,
                patient_mobile,
                doctor_mobile,
                doctor_name,
                email,
                selectedTestName,
                remarks,
                clinical_history,
                repeat_required,
                repeat_reason,
                repeat_date || null,
                internal_id,
                systolic_bp || null,
                diastolic_bp || null,
                total_cholesterol || null,
                hdl_cholesterol || null,
                ldl_cholesterol || null,
                diabetes || null,
                smoker || null,
                hypertension_treatment || null,
                statin || null,
                aspirin_therapy || null,
                "No",
                "No",
                "No",
                "No",
                new Date(new Date(registration_date).getTime() + 7 * 24 * 60 * 60 * 1000) || null, // tantive_report_date = registration_date + 7 days
                "No", // hpo_status
                "No", // annotaion
                project_id,
                patient_email,
                "processing",
                "monitering",
                trf_checkbox || 'No',
                opd_notes_checkbox || 'No',
                consent_form_checkbox || 'No',
                hpo_id_final,
                hpo_term_final
            ];
            const result = await pool.query(query, values);
            const insertedData = result.rows[0];
            const insertedId = insertedData.id;

            console.log('response', response);
            response.push({
                status: 200,
                message: "Data inserted successfully",
                data: insertedId
            });
        }
        else if (testNames.length > 1) {
            // // Generate base_internal_id ONCE
            // const date = new Date(registration_date || Date.now());
            // const year = date.getFullYear();

            // // Find the max numeric part for this year from the whole table
            // const maxInternalIdQuery = `
            //     SELECT MAX(CAST(SUBSTRING(CAST(internal_id AS TEXT), 5, 5) AS INTEGER)) AS max_seq
            //     FROM master_sheet
            //     WHERE LEFT(CAST(internal_id AS TEXT), 4) = $1
            // `;
            // const maxInternalIdResult = await pool.query(maxInternalIdQuery, [String(year)]);
            // const maxSeq = maxInternalIdResult.rows[0]?.max_seq || 0;
            // const nextSeq = maxSeq + 1;
            // const base_internal_id = `${year}${String(nextSeq).padStart(5, '0')}`;

            const formatRes = await pool.query(
                `SELECT * FROM id_format WHERE hospital_name = $1`,
                [hospital_name]
            );
            const format = formatRes.rows[0];

            const now = new Date(registration_date || Date.now());
            const currentYear = String(now.getFullYear());
            const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

            let base_internal_id;
            let nextSeq = format.internal_id_last_seq + 1;

            // If year/month format (no prefix/separator)
            if (format.internal_id_pad_length && format.internal_id_prefix === '' && format.internal_id_separator === '') {
                // Reset sequence if year/month changed
                if (format.internal_id_last_year !== currentYear || format.internal_id_last_month !== currentMonth) {
                    nextSeq = 1;
                }
                base_internal_id = `${currentYear}${currentMonth}${String(nextSeq).padStart(format.internal_id_pad_length, '0')}`;
                await pool.query(
                    `UPDATE id_format SET internal_id_last_seq = $1, internal_id_last_year = $2, internal_id_last_month = $3 WHERE hospital_name = $4`,
                    [nextSeq, currentYear, currentMonth, hospital_name]
                );
            } else {
                // Generic format: prefix + separator + padded sequence
                base_internal_id = `${format.internal_id_prefix}${format.internal_id_separator || ""}${String(nextSeq).padStart(Number(format.internal_id_pad_length), "0")}`;
                await pool.query(
                    `UPDATE id_format SET internal_id_last_seq = $1 WHERE hospital_name = $2`,
                    [nextSeq, hospital_name]
                );
            }

            let trf_file_id = null;
            if (file && typeof file.arrayBuffer === "function") {
                const fileBuffer = Buffer.from(await file.arrayBuffer());
                const auth = new google.auth.GoogleAuth({
                    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
                    scopes: ["https://www.googleapis.com/auth/drive"],
                });
                const drive = google.drive({ version: "v3", auth });
                const response = await drive.files.create({
                    requestBody: {
                        name: base_internal_id, // Use base_internal_id as file name
                        parents: ["1xzTkB-k3PxEbGpvj4yoHXxBFgAtCLz1p"], // Your folder ID
                    },
                    media: {
                        mimeType: file.type,
                        body: Readable.from(fileBuffer),
                    },
                    supportsAllDrives: true,
                    driveId: "0AGcjkp59qA5iUk9PVA", // Your shared drive ID
                });
                trf_file_id = response.data.id;
            }

            for (const testName of testNames) {
                let internal_id;
                // Special handling for Myeloid
                if (testName === "Myeloid") {
                    // You must get myeloid_type (DNA/RNA) from frontend
                    internal_id = `${base_internal_id}-${sample_type}`; // sample_type should be DNA/RNA
                } else {
                    internal_id = `${base_internal_id}-${testName.replace(/\s+/g, '').replace(/[^\w+]/g, '')}`;
                }

                const query = `
                    INSERT INTO master_sheet (
                        hospital_name,
                        dept_name,
                        vial_received,
                        specimen_quality,
                        registration_date,
                        sample_date,
                        sample_type,
                        trf,
                        collection_date_time,
                        storage_condition,
                        prority,
                        hospital_id,
                        client_id,
                        client_name,
                        sample_id,
                        patient_name,
                        DOB,
                        age,
                        gender,
                        ethnicity,
                        father_mother_name,
                        spouse_name,
                        address,
                        city,
                        state,
                        country,
                        patient_mobile,
                        doctor_mobile,
                        doctor_name,
                        email,
                        test_name,
                        remarks,
                        clinical_history,
                        repeat_required,
                        repeat_reason,
                        repeat_date,
                        internal_id,
                        systolic_bp,
                        diastolic_bp,
                        total_cholesterol,
                        hdl_cholesterol,
                        ldl_cholesterol,
                        diabetes,
                        smoker,
                        hypertension_treatment,
                        statin,
                        aspirin_therapy,
                        dna_isolation,
                        lib_prep,
                        under_seq,
                        seq_completed,
                        tantive_report_date,
                        hpo_status,
                        annotation,
                        project_id,
                        patient_email,
                        sample_status,
                        location,
                        trf_checkbox,
                        opd_notes_checkbox,
                        consent_form_checkbox,
                        base_internal_id,
                        hpo_id,
                        hpo_term
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18,
                        $19, $20, $21, $22, $23, $24, $25,
                        $26, $27, $28, $29, $30,
                        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                        $41, $42, $43, $44, $45, $46,$47, $48,
                        $49, $50, $51, $52, $53, $54, $55, $56, $57, $58,
                        $59, $60, $61, $62, $63, $64
                    )
                    RETURNING *
                `;
                const values = [
                    hospital_name,
                    dept_name || null,
                    vial_received,
                    specimen_quality,
                    registration_date || null,
                    sample_date || null,
                    sample_type,
                    trf_file_id || null,
                    collection_date_time || null,
                    storage_condition,
                    prority,
                    hospital_id,
                    client_id,
                    client_name,
                    sample_id,
                    patient_name,
                    DOB || null,
                    age,
                    gender,
                    ethnicity,
                    father_mother_name,
                    spouse_name,
                    address,
                    city,
                    state,
                    country,
                    patient_mobile,
                    doctor_mobile,
                    doctor_name,
                    email,
                    testName,
                    remarks,
                    clinical_history,
                    repeat_required,
                    repeat_reason,
                    repeat_date || null,
                    internal_id,
                    systolic_bp || null,
                    diastolic_bp || null,
                    total_cholesterol || null,
                    hdl_cholesterol || null,
                    ldl_cholesterol || null,
                    diabetes || null,
                    smoker || null,
                    hypertension_treatment || null,
                    statin || null,
                    aspirin_therapy || null,
                    "No",
                    "No",
                    "No",
                    "No",
                    new Date(new Date(registration_date).getTime() + 7 * 24 * 60 * 60 * 1000) || null, // tantive_report_date = registration_date + 7 days
                    "No", // hpo_status
                    "No", // annotaion
                    project_id,
                    patient_email,
                    "processing",
                    "monitering",
                    trf_checkbox || 'No',
                    opd_notes_checkbox || 'No',
                    consent_form_checkbox || 'No',
                    base_internal_id,
                    hpo_id_final,
                    hpo_term_final
                ];
                const result = await pool.query(query, values);
                const insertedData = result.rows[0];
                const insertedId = insertedData.id;
                response.push({
                    status: 200,
                    message: "Data inserted successfully",
                    data: insertedId
                });
                console.log('response', response);
            }
        }


        return NextResponse.json(response);

    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: "Failed to insert data" }, { status: 500 });
    }

}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const hospital_name = searchParams.get('hospital_name');
    try {
        let response = [];

        if (!role) {
            response.push({
                status: 400,
                message: 'Role is required',
            });
            return NextResponse.json(response);
        }

        if (role === 'SuperAdmin') {
            // Fetch all data for SuperAdmin
            const { rows } = await pool.query('SELECT * FROM master_sheet');
            if (rows.length === 0) {
                response.push({
                    status: 404,
                    message: 'No data found',
                });
            } else {
                response.push({
                    status: 200,
                    data: rows,
                });
            }
        } else if (hospital_name) {
            // Fetch data for a specific hospital
            const { rows } = await pool.query('SELECT * FROM master_sheet WHERE hospital_name = $1', [hospital_name]);
            if (rows.length === 0) {
                response.push({
                    status: 404,
                    message: 'No data found for the specified hospital',
                });
            } else {
                response.push({
                    status: 200,
                    data: rows,
                });
            }
        } else {
            response.push({
                status: 400,
                message: 'Organization Name is required for non-SuperAdmin roles',
            });
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    const body = await request.json();
    const { internal_id, updates, auditLog } = body;
    try {
        const response = [];
        if (!internal_id || !updates || typeof updates !== "object") {
            response.push({
                status: 400,
                message: "Internal ID and updates are required.",
            });
            return NextResponse.json(response, { status: 400 });
        }

        const updatesCleanedLower = {};
        Object.keys(updates).forEach(key => {
            const val = updates[key];
            if (val !== "" && val !== undefined) {
                // Convert object or array to JSON string
                if (typeof val === 'object' && val !== null) {
                    updatesCleanedLower[key.toLowerCase()] = JSON.stringify(val);
                } else {
                    updatesCleanedLower[key.toLowerCase()] = val;
                }
            }
        });
        const columns = Object.keys(updatesCleanedLower);
        const values = Object.values(updatesCleanedLower);
        values.push(internal_id);

        if (columns.length === 0) {
            response.push({
                status: 400,
                message: "No valid fields to update.",
            });
            return NextResponse.json(response, { status: 400 });
        }

        const setClause = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
        const query = `
            UPDATE master_sheet
            SET ${setClause}
            WHERE internal_id = $${columns.length + 1}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            response.push({
                status: 404,
                message: "Internal ID not found or no updates made.",
            });
        } else {
            if (auditLog) {
                const safeChanges = auditLog && Array.isArray(auditLog.changes)
                    ? auditLog.changes.map(change => ({
                        field: String(change.field ?? ''),
                        oldValue: String(change.oldValue ?? ''),
                        newValue: String(change.newValue ?? '')
                    }))
                    : [];

                const auditQuery = `
                     INSERT INTO audit_logs (sample_id, changed_by, changes, changed_at, comments, hospital_name)
                     VALUES ($1, $2, $3::jsonb, $4, $5, $6)
                    `;

                const auditValues = [
                    auditLog.sample_id,
                    auditLog.changed_by,
                    JSON.stringify(safeChanges) || null,
                    auditLog.changed_at,
                    auditLog.comments || null,
                    auditLog.hospital_name || null

                ];
                await pool.query(auditQuery, auditValues);
            }

            response.push({
                status: 200,
                message: "Data updated successfully.",
                data: result.rows[0]
            });
        }
        return NextResponse.json(response);
    } catch (error) {
        console.error("Error updating data:", error);
        return NextResponse.json(
            {
                status: 500,
                message: "Internal Server Error",
                error: error.message
            },
            { status: 500 }
        );
    }
}
