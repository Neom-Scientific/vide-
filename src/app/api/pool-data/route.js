import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const hospital_name = searchParams.get('hospital_name');
    const parseList = (param) => {
        const val = searchParams.get(param);
        return val ? val.split(',').map(v => v.trim()).filter(Boolean) : [];
    };
    const testNames = parseList('application'); // Parse test names from query parameters
    const internal_ids = parseList('internal_id').filter(id => typeof id === 'string' && id.trim().length > 0); // Ensure internal_ids are non-empty strings
    console.log('internal_ids', internal_ids);

    try {
        const response = [];
        const poolData = [];

        // Validate hospital_name
        if (!hospital_name) {
            response.push({
                status: 400,
                message: "Organization Name is required"
            });
        }

        // Validate testNames
        if (!testNames.length) {
            response.push({
                status: 400,
                message: "Test name is required"
            });
        }

        // Query by internal_ids if provided
        if (internal_ids.length > 0) {
            const { rows } = await pool.query(
                `SELECT * FROM master_sheet WHERE internal_id = ANY($1::text[]) ORDER BY registration_date;`,
                [internal_ids]
            );

            if (rows.length === 0) {
                response.push({
                    status: 404,
                    message: `No pool data found for the provided sample IDs`
                });
            } else {
                poolData.push(...rows); // Add rows to the poolData array
            }
        }

        // If no internal_ids provided, query by hospital_name and testNames
        if (internal_ids.length === 0 && hospital_name && testNames.length > 0) {
            for (const testName of testNames) {
                const { rows } = await pool.query(
                    `SELECT * FROM pool_info WHERE hospital_name = $1 AND test_name = $2 ;`,
                    [hospital_name, testName]
                );

                if (rows.length === 0) {
                    response.push({
                        status: 404,
                        message: `No pool data found for Organization Name "${hospital_name}" and test name "${testName}"`
                    });
                } else {
                    poolData.push(...rows); // Add rows to the poolData array
                }
            }
        }

        // Remove duplicate rows from poolData
        const uniquePoolData = Array.from(new Map(poolData.map(item => [item.internal_id, item])).values());

        // Return successful response
        response.push({
            status: 200,
            data: uniquePoolData
        });
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching pool data:', error);
        return NextResponse.json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export async function PUT(request) {
    const body = await request.json();
    const { sample_id, sample_indicator, indicator_status, changed_by, internal_id,hospital_name } = body.data;
    // console.log('body', body);
    try {
        const response = [];

        if (sample_indicator === 'dna_isolation') {
            await pool.query(`UPDATE master_sheet SET dna_isolation = $2 WHERE internal_id = $1`, [internal_id, indicator_status]);
            await pool.query(`INSERT INTO audit_logs (sample_id, comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, $4, $5)`, [sample_id, 'DNA Isolation status updated', changed_by, new Date(), hospital_name]);
            response.push({
                message: 'Sample indicator updated successfully',
                indicator_status: indicator_status,
                status: 200
            });
        }
        else if (sample_indicator === 'lib_prep') {
            await pool.query(`UPDATE master_sheet SET lib_prep = $2 WHERE internal_id = $1`, [internal_id, indicator_status]);
            await pool.query(`INSERT INTO audit_logs (sample_id, comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, $4, $5)`, [sample_id, 'Library Preparation status updated', changed_by, new Date(), hospital_name]);
            response.push({
                message: 'Sample indicator updated successfully',
                indicator_status: indicator_status,
                status: 200
            });
        }
        else if (sample_indicator === 'under_seq') {
            await pool.query(`UPDATE master_sheet SET under_seq = $2 WHERE internal_id = $1`, [internal_id, indicator_status]);
            await pool.query(`INSERT INTO audit_logs (sample_id, comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, $4, $5)`, [sample_id, 'Under Sequencing status updated', changed_by, new Date(), hospital_name]);
            response.push({
                message: 'Sample indicator updated successfully',
                status: 200
            });
        }
        else if (sample_indicator === 'seq_completed') {
            await pool.query(`UPDATE master_sheet SET seq_completed = $2,location = $3 WHERE internal_id = $1`, [internal_id, indicator_status, 'seq_completed']);
            await pool.query(`INSERT INTO audit_logs (sample_id, comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, $4, $5)`, [sample_id, 'Sequencing Completed status updated', changed_by, new Date(), hospital_name]);
            response.push({
                message: 'Sample indicator updated successfully',
                status: 200
            });
        }
        else {
            response.push({
                message: 'Invalid sample indicator',
                status: 400
            });
        }
        return NextResponse.json(response);
    }
    catch (error) {
        console.error("Error updating sample indicator:", error);
        return NextResponse.json({ error: "Failed to update sample indicator" }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { rows, testName, hospital_name } = body;
    try {
        const response = [];
        if (!hospital_name) {
            response.push({
                message: 'Organization Name is required',
                status: 400
            });
        }
        if (!testName) {
            response.push({
                message: 'Test name is required',
                status: 400
            });
        }
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            response.push({
                message: 'Rows data is required',
                status: 400
            });
        }
        if (testName === "Myeloid") {
            for (const sample of rows) {
                const { sample_id, qubit_dna, data_required, batch_id, conc_rxn, well, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, size, pool_no, internal_id, vol_for_40nm_percent_pooling,
                    volume_from_40nm_for_total_25ul_pool, tapestation_size, tapestation_conc,plate_designation,i5_index_forward
                } = sample;

                if (!sample_id) {
                    response.push({ message: 'Sample Id is required', status: 400 });
                    continue;
                }

                const sanitized = {
                    qubit_dna: toNumberOrNull(qubit_dna),
                    data_required: toNumberOrNull(data_required),
                    conc_rxn: toNumberOrNull(conc_rxn),
                    vol_for_40nm_percent_pooling: toNumberOrNull(vol_for_40nm_percent_pooling),
                    volume_from_40nm_for_total_25ul_pool: toNumberOrNull(volume_from_40nm_for_total_25ul_pool),
                    well,
                    i5_index_reverse,
                    i7_index,
                    lib_qubit: toNumberOrNull(lib_qubit),
                    nm_conc: toNumberOrNull(nm_conc),
                    lib_vol_for_20nm: toNumberOrNull(lib_vol_for_20nm),
                    nfw_volu_for_20nm: toNumberOrNull(nfw_volu_for_20nm),
                    total_vol_for_20nm: toNumberOrNull(total_vol_for_20nm),
                    size: toNumberOrNull(size),
                    lib_prep_date: new Date().toISOString(),
                    tapestation_conc: toNumberOrNull(tapestation_conc),
                    tapestation_size: toNumberOrNull(tapestation_size),
                    plate_designation: plate_designation || null,
                    i5_index_forward
                };

                await pool.query(`INSERT INTO pool_info (qubit_dna, data_required, conc_rxn, well, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, size, test_name, hospital_name, lib_prep_date, sample_id, internal_id, batch_id, vol_for_40nm_percent_pooling, volume_from_40nm_for_total_25ul_pool, tapestation_size, tapestation_conc , plate_designation,i5_index_forward)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) 
                     ON CONFLICT (internal_id) 
                     DO UPDATE SET
                        qubit_dna = EXCLUDED.qubit_dna, 
                        data_required = EXCLUDED.data_required, 
                        conc_rxn = EXCLUDED.conc_rxn,
                        well = EXCLUDED.well, 
                        i5_index_reverse = EXCLUDED.i5_index_reverse, 
                        i7_index = EXCLUDED.i7_index,
                        lib_qubit = EXCLUDED.lib_qubit,
                        nm_conc = EXCLUDED.nm_conc,
                        lib_vol_for_20nm = EXCLUDED.lib_vol_for_20nm,
                        nfw_volu_for_20nm = EXCLUDED.nfw_volu_for_20nm,
                        total_vol_for_20nm = EXCLUDED.total_vol_for_20nm,
                        size = EXCLUDED.size, 
                        test_name = EXCLUDED.test_name,
                        hospital_name = EXCLUDED.hospital_name,
                        lib_prep_date = EXCLUDED.lib_prep_date,
                        sample_id = EXCLUDED.sample_id,
                        batch_id = EXCLUDED.batch_id,
                        vol_for_40nm_percent_pooling = EXCLUDED.vol_for_40nm_percent_pooling,
                        volume_from_40nm_for_total_25ul_pool = EXCLUDED.volume_from_40nm_for_total_25ul_pool,
                        tapestation_size = EXCLUDED.tapestation_size,
                        tapestation_conc = EXCLUDED.tapestation_conc,
                        plate_designation = EXCLUDED.plate_designation,
                        i5_index_forward = EXCLUDED.i5_index_forward
                     WHERE pool_info.internal_id = $17`,
                    [
                        sanitized.qubit_dna, sanitized.data_required, sanitized.conc_rxn, sanitized.well, sanitized.i5_index_reverse, sanitized.i7_index, sanitized.lib_qubit, sanitized.nm_conc, sanitized.lib_vol_for_20nm, sanitized.nfw_volu_for_20nm, sanitized.total_vol_for_20nm, sanitized.size, testName, hospital_name, sanitized.lib_prep_date, sample_id, internal_id, batch_id,
                        sanitized.vol_for_40nm_percent_pooling || null,
                        sanitized.volume_from_40nm_for_total_25ul_pool || null,
                        sanitized.tapestation_size || null,
                        sanitized.tapestation_conc || null,plate_designation || null,sanitized.i5_index_forward || null
                    ]
                )

                await pool.query(
                    `UPDATE master_sheet SET qubit_dna = $1, data_required = $2, conc_rxn = $3, well = $4,
                     i5_index_reverse = $5, i7_index = $6, lib_qubit = $7, nm_conc = $8,
                     lib_vol_for_20nm = $9, nfw_volu_for_20nm = $10, total_vol_for_20nm = $11,
                     size = $12, pool_no = $16, lib_prep_date = $17 , batch_id = $18, vol_for_40nm_percent_pooling = $19, volume_from_40nm_for_total_25ul_pool=$20 , tapestation_size = $21 , tapestation_conc = $22, plate_designation = $23, i5_index_forward = $24 WHERE internal_id = $13 AND test_name = $14 AND hospital_name = $15`,
                    [sanitized.qubit_dna, sanitized.data_required, sanitized.conc_rxn, sanitized.well, sanitized.i5_index_reverse, sanitized.i7_index,
                    sanitized.lib_qubit, sanitized.nm_conc, sanitized.lib_vol_for_20nm, sanitized.nfw_volu_for_20nm, sanitized.total_vol_for_20nm,
                    sanitized.size, internal_id, testName, hospital_name, sanitized.pool_no, sanitized.lib_prep_date, batch_id, sanitized.vol_for_40nm_percent_pooling || null, sanitized.volume_from_40nm_for_total_25ul_pool || null, sanitized.tapestation_size || null, sanitized.tapestation_conc || null , plate_designation || null, sanitized.i5_index_forward || null]
                );
                response.push({ message: 'Data updated successfully', status: 200 });
            }
        }
        if (testName === "WES" ||
            testName === "Carrier Screening" ||
            testName === "CES" ||
            testName === "Cardio Comprehensive (Screening)" ||
            testName === "Cardio Metabolic Syndrome (Screening)" ||
            testName === "WES + Mito" ||
            testName === "CES + Mito" ||
            testName === "HRR" ||
            testName === "HCP" ||
            testName === "Cardio Comprehensive Myopathy") {
            for (const sample of rows) {
                const { sample_id, qubit_dna, data_required, per_rxn_gdna, volume, gdna_volume_3x, nfw, plate_designation, well, i5_index_reverse, i7_index, qubit_lib_qc_ng_ul, stock_ng_ul, lib_vol_for_hyb, gb_per_sample, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, pool_no, internal_id, batch_id, vol_for_40nm_percent_pooling, volume_from_40nm_for_total_25ul_pool, test_name , lib_qubit_for_2nm , nm_conc_for_2nm , lib_vol_for_2nm , nfw_vol_for_2nm , total_vol_for_2nm , size_for_2nm, i5_index_forward} = sample;

                if (!sample_id) {
                    response.push({ message: 'Sample Id is required', status: 400 });
                    continue;
                }

                const sanitized = {
                    qubit_dna: toNumberOrNull(qubit_dna),
                    data_required: toNumberOrNull(data_required),
                    per_rxn_gdna: toNumberOrNull(per_rxn_gdna),
                    volume: toNumberOrNull(volume),
                    gdna_volume_3x: toNumberOrNull(gdna_volume_3x),
                    nfw: toNumberOrNull(nfw),
                    vol_for_40nm_percent_pooling: toNumberOrNull(vol_for_40nm_percent_pooling),
                    volume_from_40nm_for_total_25ul_pool: toNumberOrNull(volume_from_40nm_for_total_25ul_pool),
                    plate_designation,
                    well,
                    i5_index_reverse,
                    i7_index,
                    qubit_lib_qc_ng_ul: toNumberOrNull(qubit_lib_qc_ng_ul),
                    stock_ng_ul: toNumberOrNull(stock_ng_ul),
                    lib_vol_for_hyb: toNumberOrNull(lib_vol_for_hyb),
                    gb_per_sample: toNumberOrNull(gb_per_sample),
                    pool_conc: toNumberOrNull(pool_conc),
                    size: toNumberOrNull(size),
                    nm_conc: toNumberOrNull(nm_conc),
                    one_tenth_of_nm_conc: toNumberOrNull(one_tenth_of_nm_conc),
                    total_vol_for_20nm: toNumberOrNull(total_vol_for_20nm),
                    lib_vol_for_20nm: toNumberOrNull(lib_vol_for_20nm),
                    nfw_volu_for_20nm: toNumberOrNull(nfw_volu_for_20nm),
                    pool_no,
                    lib_qubit_for_2nm: toNumberOrNull(lib_qubit_for_2nm),
                    nm_conc_for_2nm: toNumberOrNull(nm_conc_for_2nm),
                    lib_vol_for_2nm: toNumberOrNull(lib_vol_for_2nm),
                    nfw_vol_for_2nm: toNumberOrNull(nfw_vol_for_2nm),
                    total_vol_for_2nm: toNumberOrNull(total_vol_for_2nm),
                    size_for_2nm: toNumberOrNull(size_for_2nm),
                    i5_index_forward
                };

                await pool.query(
                    `INSERT INTO pool_info (
                      qubit_dna,
                      data_required, 
                      per_rxn_gdna, volume, 
                      gdna_volume_3x,
                      nfw, 
                      plate_designation,
                      well,
                      i5_index_reverse,
                      i7_index, 
                      qubit_lib_qc_ng_ul, 
                      stock_ng_ul, 
                      lib_vol_for_hyb, 
                      gb_per_sample,
                      pool_conc,
                      size, 
                      nm_conc,
                      one_tenth_of_nm_conc,
                      total_vol_for_20nm,
                      lib_vol_for_20nm,
                      nfw_volu_for_20nm,
                      pool_no, 
                      sample_id, 
                      hospital_name,
                      test_name,
                      internal_id,
                      batch_id,
                      vol_for_40nm_percent_pooling,
                      volume_from_40nm_for_total_25ul_pool,
                        lib_qubit_for_2nm,
                        nm_conc_for_2nm,
                        lib_vol_for_2nm,
                        nfw_vol_for_2nm,
                        total_vol_for_2nm,
                        size_for_2nm,
                        i5_index_forward
                    )
                    VALUES (
                      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,$27,$28,$29,$30,$31,$32,$33,$34,$35, $36
                    )
                    ON CONFLICT (internal_id) 
                    DO UPDATE SET
                    qubit_dna = EXCLUDED.qubit_dna, 
                    data_required = EXCLUDED.data_required, 
                    per_rxn_gdna = EXCLUDED.per_rxn_gdna,
                    volume = EXCLUDED.volume, 
                    gdna_volume_3x = EXCLUDED.gdna_volume_3x,
                    nfw = EXCLUDED.nfw,
                    plate_designation = EXCLUDED.plate_designation,
                    well = EXCLUDED.well,
                    i5_index_reverse = EXCLUDED.i5_index_reverse, 
                    i7_index = EXCLUDED.i7_index,
                    qubit_lib_qc_ng_ul = EXCLUDED.qubit_lib_qc_ng_ul, 
                    stock_ng_ul = EXCLUDED.stock_ng_ul,
                    lib_vol_for_hyb = EXCLUDED.lib_vol_for_hyb, 
                    gb_per_sample = EXCLUDED.gb_per_sample,
                    pool_conc = EXCLUDED.pool_conc, 
                    size = EXCLUDED.size,
                    nm_conc = EXCLUDED.nm_conc,
                    one_tenth_of_nm_conc = EXCLUDED.one_tenth_of_nm_conc,
                    total_vol_for_20nm = EXCLUDED.total_vol_for_20nm,
                    lib_vol_for_20nm = EXCLUDED.lib_vol_for_20nm,
                    nfw_volu_for_20nm = EXCLUDED.nfw_volu_for_20nm,
                    pool_no = EXCLUDED.pool_no,
                    sample_id = EXCLUDED.sample_id,
                    hospital_name = EXCLUDED.hospital_name,
                    test_name = EXCLUDED.test_name,
                    batch_id = EXCLUDED.batch_id,
                    lib_prep_date = NOW(),
                    vol_for_40nm_percent_pooling = EXCLUDED.vol_for_40nm_percent_pooling,
                    volume_from_40nm_for_total_25ul_pool = EXCLUDED.volume_from_40nm_for_total_25ul_pool,
                    lib_qubit_for_2nm = EXCLUDED.lib_qubit_for_2nm,
                    nm_conc_for_2nm = EXCLUDED.nm_conc_for_2nm,
                    lib_vol_for_2nm = EXCLUDED.lib_vol_for_2nm,
                    nfw_vol_for_2nm = EXCLUDED.nfw_vol_for_2nm,
                    total_vol_for_2nm = EXCLUDED.total_vol_for_2nm,
                    size_for_2nm = EXCLUDED.size_for_2nm,
                    i5_index_forward = EXCLUDED.i5_index_forward
                    WHERE pool_info.internal_id = $26`,
                    [
                        sanitized.qubit_dna,
                        sanitized.data_required,
                        sanitized.per_rxn_gdna,
                        sanitized.volume,
                        sanitized.gdna_volume_3x,
                        sanitized.nfw,
                        sanitized.plate_designation,
                        sanitized.well,
                        sanitized.i5_index_reverse,
                        sanitized.i7_index,
                        sanitized.qubit_lib_qc_ng_ul,
                        sanitized.stock_ng_ul,
                        sanitized.lib_vol_for_hyb,
                        sanitized.gb_per_sample,
                        sanitized.pool_conc,
                        sanitized.size,
                        sanitized.nm_conc,
                        sanitized.one_tenth_of_nm_conc,
                        sanitized.total_vol_for_20nm,
                        sanitized.lib_vol_for_20nm,
                        sanitized.nfw_volu_for_20nm,
                        sanitized.pool_no,
                        sample_id,
                        hospital_name,
                        testName,
                        internal_id,
                        batch_id,
                        sanitized.vol_for_40nm_percent_pooling || null,
                        sanitized.volume_from_40nm_for_total_25ul_pool || null,
                        sanitized.lib_qubit_for_2nm || null,
                        sanitized.nm_conc_for_2nm || null,
                        sanitized.lib_vol_for_2nm || null,
                        sanitized.nfw_vol_for_2nm || null,
                        sanitized.total_vol_for_2nm || null,
                        sanitized.size_for_2nm || null,
                        sanitized.i5_index_forward || null
                    ]
                );

                await pool.query(
                    `UPDATE master_sheet SET qubit_dna = $1, data_required = $2, per_rxn_gdna = $3,
                     volume = $4, gdna_volume_3x = $5, nfw = $6, plate_designation = $7,
                     well = $8, i5_index_reverse = $9, i7_index = $10,
                     qubit_lib_qc_ng_ul = $11, stock_ng_ul = $12,
                     lib_vol_for_hyb = $13, gb_per_sample = $14,
                     pool_conc = $15, size = $16,
                     nm_conc = $17, one_tenth_of_nm_conc = $18,
                     total_vol_for_20nm = $19,
                     lib_vol_for_20nm = $20,
                     nfw_volu_for_20nm = $21, pool_no = $22,batch_id = $26,
                     lib_prep_date = NOW(),
                        vol_for_40nm_percent_pooling = $27,
                        volume_from_40nm_for_total_25ul_pool = $28 ,
                        lib_qubit_for_2nm = $29,
                        nm_conc_for_2nm = $30,
                        lib_vol_for_2nm = $31,
                        nfw_vol_for_2nm = $32,
                        total_vol_for_2nm = $33,
                        size_for_2nm = $34,
                        i5_index_forward = $35
                     WHERE internal_id = $23 AND test_name = $24 AND hospital_name = $25`,
                    [sanitized.qubit_dna, sanitized.data_required, sanitized.per_rxn_gdna, sanitized.volume,
                    sanitized.gdna_volume_3x, sanitized.nfw, sanitized.plate_designation,
                    sanitized.well, sanitized.i5_index_reverse, sanitized.i7_index,
                    sanitized.qubit_lib_qc_ng_ul, sanitized.stock_ng_ul,
                    sanitized.lib_vol_for_hyb, sanitized.gb_per_sample,
                    sanitized.pool_conc, sanitized.size, sanitized.nm_conc, sanitized.one_tenth_of_nm_conc,
                    sanitized.total_vol_for_20nm, sanitized.lib_vol_for_20nm,
                    sanitized.nfw_volu_for_20nm, sanitized.pool_no, internal_id, test_name, hospital_name, batch_id, sanitized.vol_for_40nm_percent_pooling || null, sanitized.volume_from_40nm_for_total_25ul_pool || null, sanitized.lib_qubit_for_2nm || null, sanitized.nm_conc_for_2nm || null, sanitized.lib_vol_for_2nm || null, sanitized.nfw_vol_for_2nm || null, sanitized.total_vol_for_2nm || null, sanitized.size_for_2nm || null, sanitized.i5_index_forward || null]
                );
                response.push({ message: 'Data updated successfully', status: 200 });
            }
        }
        if (testName === 'SGS') {
            for (const sample of rows) {
                const { sample_id, qubit_dna, data_required, well, i7_index, sample_volume, qubit_lib_qc_ng_ul, pooling_volume, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, pool_no, internal_id, batch_id, vol_for_40nm_percent_pooling, volume_from_40nm_for_total_25ul_pool, plate_designation ,lib_qubit_for_2nm , nm_conc_for_2nm , lib_vol_for_2nm , nfw_vol_for_2nm , total_vol_for_2nm , size_for_2nm ,i5_index_forward } = sample;

                if (!sample_id) {
                    response.push({ message: 'Sample Id is required', status: 400 });
                    continue;
                }

                const sanitized = {
                    qubit_dna: toNumberOrNull(qubit_dna),
                    data_required: toNumberOrNull(data_required),
                    well,
                    i7_index,
                    vol_for_40nm_percent_pooling: toNumberOrNull(vol_for_40nm_percent_pooling),
                    volume_from_40nm_for_total_25ul_pool: toNumberOrNull(volume_from_40nm_for_total_25ul_pool),
                    sample_volume: toNumberOrNull(sample_volume),
                    qubit_lib_qc_ng_ul: toNumberOrNull(qubit_lib_qc_ng_ul),
                    pooling_volume: toNumberOrNull(pooling_volume),
                    pool_conc: toNumberOrNull(pool_conc),
                    size: toNumberOrNull(size),
                    nm_conc: toNumberOrNull(nm_conc),
                    one_tenth_of_nm_conc: toNumberOrNull(one_tenth_of_nm_conc),
                    total_vol_for_20nm: toNumberOrNull(total_vol_for_20nm),
                    lib_vol_for_20nm: toNumberOrNull(lib_vol_for_20nm),
                    nfw_volu_for_20nm: toNumberOrNull(nfw_volu_for_20nm),
                    pool_no,
                    lib_prep_date: new Date().toISOString(),
                    lib_qubit_for_2nm: toNumberOrNull(lib_qubit_for_2nm),
                    nm_conc_for_2nm: toNumberOrNull(nm_conc_for_2nm),
                    lib_vol_for_2nm: toNumberOrNull(lib_vol_for_2nm),
                    nfw_vol_for_2nm: toNumberOrNull(nfw_vol_for_2nm),
                    total_vol_for_2nm: toNumberOrNull(total_vol_for_2nm),
                    size_for_2nm: toNumberOrNull(size_for_2nm),
                    i5_index_forward
                };

                await pool.query(
                    `INSERT INTO pool_info (
                      qubit_dna, data_required, well, i7_index, sample_volume, qubit_lib_qc_ng_ul, pooling_volume, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, pool_no, test_name, hospital_name, lib_prep_date, sample_id, internal_id, batch_id, vol_for_40nm_percent_pooling, volume_from_40nm_for_total_25ul_pool,plate_designation, lib_qubit_for_2nm, nm_conc_for_2nm, lib_vol_for_2nm, nfw_vol_for_2nm, total_vol_for_2nm, size_for_2nm, i5_index_forward
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,$24 , $25, $26, $27, $28, $29, $30, $31)
                    ON CONFLICT (internal_id)
                    DO UPDATE SET
                      qubit_dna = EXCLUDED.qubit_dna,
                      data_required = EXCLUDED.data_required,
                      well = EXCLUDED.well,
                      i7_index = EXCLUDED.i7_index,
                      sample_volume = EXCLUDED.sample_volume,
                      qubit_lib_qc_ng_ul = EXCLUDED.qubit_lib_qc_ng_ul,
                      pooling_volume = EXCLUDED.pooling_volume,
                      pool_conc = EXCLUDED.pool_conc,
                      size = EXCLUDED.size,
                      nm_conc = EXCLUDED.nm_conc,
                      one_tenth_of_nm_conc = EXCLUDED.one_tenth_of_nm_conc,
                      total_vol_for_20nm = EXCLUDED.total_vol_for_20nm,
                      lib_vol_for_20nm = EXCLUDED.lib_vol_for_20nm,
                      nfw_volu_for_20nm = EXCLUDED.nfw_volu_for_20nm,
                      pool_no = EXCLUDED.pool_no,
                      test_name = EXCLUDED.test_name,
                      hospital_name = EXCLUDED.hospital_name,
                      lib_prep_date = EXCLUDED.lib_prep_date,
                      sample_id = EXCLUDED.sample_id,
                      batch_id = EXCLUDED.batch_id,
                      vol_for_40nm_percent_pooling = EXCLUDED.vol_for_40nm_percent_pooling,
                      volume_from_40nm_for_total_25ul_pool = EXCLUDED.volume_from_40nm_for_total_25ul_pool,
                        plate_designation = EXCLUDED.plate_designation,
                        lib_qubit_for_2nm = EXCLUDED.lib_qubit_for_2nm,
                        nm_conc_for_2nm = EXCLUDED.nm_conc_for_2nm,
                        lib_vol_for_2nm = EXCLUDED.lib_vol_for_2nm,
                        nfw_vol_for_2nm = EXCLUDED.nfw_vol_for_2nm,
                        total_vol_for_2nm = EXCLUDED.total_vol_for_2nm,
                        size_for_2nm = EXCLUDED.size_for_2nm,
                        i5_index_forward = EXCLUDED.i5_index_forward
                    WHERE pool_info.internal_id = $20`,
                    [
                        sanitized.qubit_dna, sanitized.data_required, sanitized.well, sanitized.i7_index,
                        sanitized.sample_volume, sanitized.qubit_lib_qc_ng_ul,
                        sanitized.pooling_volume, sanitized.pool_conc,
                        sanitized.size, sanitized.nm_conc,
                        sanitized.one_tenth_of_nm_conc,
                        sanitized.total_vol_for_20nm,
                        sanitized.lib_vol_for_20nm,
                        sanitized.nfw_volu_for_20nm,
                        sanitized.pool_no,
                        testName,
                        hospital_name,
                        sanitized.lib_prep_date,
                        sample_id,
                        internal_id,
                        batch_id,
                        sanitized.vol_for_40nm_percent_pooling || null,
                        sanitized.volume_from_40nm_for_total_25ul_pool || null,
                        plate_designation || null,
                        sanitized.lib_qubit_for_2nm || null,
                        sanitized.nm_conc_for_2nm || null,
                        sanitized.lib_vol_for_2nm || null,
                        sanitized.nfw_vol_for_2nm || null,
                        sanitized.total_vol_for_2nm || null,
                        sanitized.size_for_2nm || null,
                        sanitized.i5_index_forward || null
                    ]
                );

                await pool.query(
                    `UPDATE master_sheet SET 
                      qubit_dna = $1, 
                      data_required = $2,
                      well = $3, 
                      i7_index = $4, 
                      sample_volume = $5,
                      qubit_lib_qc_ng_ul = $6, 
                      pooling_volume = $7,
                      pool_conc = $8, 
                      size = $9,
                      nm_conc = $10, 
                      one_tenth_of_nm_conc = $11,
                      total_vol_for_20nm = $12,
                      lib_vol_for_20nm = $13,
                      nfw_volu_for_20nm = $14,
                      pool_no = $15,
                      lib_prep_date = $16,
                      batch_id = $17,
                      vol_for_40nm_percent_pooling = $18,
                      volume_from_40nm_for_total_25ul_pool = $19,
                        plate_designation = $23,
                        lib_qubit_for_2nm = $24,
                        nm_conc_for_2nm = $25,
                        lib_vol_for_2nm = $26,
                        nfw_vol_for_2nm = $27,
                        total_vol_for_2nm = $28,
                        size_for_2nm = $29,
                        i5_index_forward = $30
                    WHERE internal_id = $20 AND test_name = $21 AND hospital_name = $22`,
                    [
                        sanitized.qubit_dna,                       // $1
                        sanitized.data_required,                   // $2
                        sanitized.well,                            // $3
                        sanitized.i7_index,                        // $4
                        sanitized.sample_volume,                   // $5
                        sanitized.qubit_lib_qc_ng_ul,              // $6
                        sanitized.pooling_volume,                  // $7
                        sanitized.pool_conc,                       // $8
                        sanitized.size,                            // $9
                        sanitized.nm_conc,                         // $10
                        sanitized.one_tenth_of_nm_conc,            // $11
                        sanitized.total_vol_for_20nm,               // $12
                        sanitized.lib_vol_for_20nm,                 // $13
                        sanitized.nfw_volu_for_20nm,                // $14
                        sanitized.pool_no,                         // $15
                        sanitized.lib_prep_date,                   // $16
                        batch_id,                                  // $17
                        sanitized.vol_for_40nm_percent_pooling || null, // $18
                        sanitized.volume_from_40nm_for_total_25ul_pool || null, // $19
                        internal_id,                               // $20
                        testName,                                  // $21
                        hospital_name,                              // $22
                        plate_designation || null, // $23
                        sanitized.lib_qubit_for_2nm || null, // $24
                        sanitized.nm_conc_for_2nm || null, // $25
                        sanitized.lib_vol_for_2nm || null, // $26
                        sanitized.nfw_vol_for_2nm || null, // $27
                        sanitized.total_vol_for_2nm || null, // $28
                        sanitized.size_for_2nm || null, // $29
                        sanitized.i5_index_forward || null // $30

                    ]
                );
                response.push({ message: 'Data updated successfully', status: 200 });
            }
        }

        if (testName === 'HLA') {
            for (const sample of rows) {
                const { sample_id, qubit_dna, data_required, well, i7_index, i5_index_reverse, dna_vol_for_dilution, buffer_vol_to_be_added, conc_of_amplicons, vol_for_fragmentation, internal_id, batch_id, pool_no, total_vol_for_20nm, lib_prep_date, lib_vol_for_20nm, nfw_volu_for_20nm, vol_for_40nm_percent_pooling, volume_from_40nm_for_total_25ul_pool, nm_conc, size, one_tenth_of_nm_conc, plate_designation, pool_conc ,lib_qubit_for_2nm , nm_conc_for_2nm , lib_vol_for_2nm , nfw_vol_for_2nm , total_vol_for_2nm , size_for_2nm, i5_index_forward} = sample;

                if (!sample_id) {
                    response.push({ message: 'Sample Id is required', status: 400 });
                    continue;
                }


                const sanitized = {
                    qubit_dna: toNumberOrNull(qubit_dna),
                    data_required: toNumberOrNull(data_required),
                    well,
                    i7_index,
                    i5_index_reverse,
                    dna_vol_for_dilution: toNumberOrNull(dna_vol_for_dilution),
                    buffer_vol_to_be_added: toNumberOrNull(buffer_vol_to_be_added),
                    conc_of_amplicons: toNumberOrNull(conc_of_amplicons),
                    vol_for_fragmentation: toNumberOrNull(vol_for_fragmentation),
                    internal_id,
                    batch_id,
                    pool_no,
                    total_vol_for_20nm: toNumberOrNull(total_vol_for_20nm),
                    lib_prep_date: lib_prep_date || new Date().toISOString(),
                    lib_vol_for_20nm: toNumberOrNull(lib_vol_for_20nm),
                    nfw_volu_for_20nm: toNumberOrNull(nfw_volu_for_20nm),
                    vol_for_40nm_percent_pooling: toNumberOrNull(vol_for_40nm_percent_pooling),
                    volume_from_40nm_for_total_25ul_pool: toNumberOrNull(volume_from_40nm_for_total_25ul_pool),
                    nm_conc: toNumberOrNull(nm_conc),
                    size: toNumberOrNull(size),
                    one_tenth_of_nm_conc: toNumberOrNull(one_tenth_of_nm_conc),
                    plate_designation,
                    pool_conc: toNumberOrNull(pool_conc),
                    lib_qubit_for_2nm: toNumberOrNull(lib_qubit_for_2nm),
                    nm_conc_for_2nm: toNumberOrNull(nm_conc_for_2nm),
                    lib_vol_for_2nm: toNumberOrNull(lib_vol_for_2nm),
                    nfw_vol_for_2nm: toNumberOrNull(nfw_vol_for_2nm),
                    total_vol_for_2nm: toNumberOrNull(total_vol_for_2nm),
                    size_for_2nm: toNumberOrNull(size_for_2nm),
                    i5_index_forward
                };

                await pool.query(`INSERT INTO pool_info (
                        qubit_dna, data_required, well, i7_index, i5_index_reverse, dna_vol_for_dilution, buffer_vol_to_be_added, conc_of_amplicons, vol_for_fragmentation, test_name, hospital_name, lib_prep_date, sample_id, internal_id, batch_id, pool_no, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, vol_for_40nm_percent_pooling, volume_from_40nm_for_total_25ul_pool, nm_conc, size, one_tenth_of_nm_conc, plate_designation, pool_conc, lib_qubit_for_2nm, nm_conc_for_2nm, lib_vol_for_2nm, nfw_vol_for_2nm, total_vol_for_2nm, size_for_2nm, i5_index_forward
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
                    ON CONFLICT (internal_id) 
                    DO UPDATE SET
                        qubit_dna = EXCLUDED.qubit_dna,
                        data_required = EXCLUDED.data_required,
                        well = EXCLUDED.well,
                        i7_index = EXCLUDED.i7_index,
                        i5_index_reverse = EXCLUDED.i5_index_reverse,
                        dna_vol_for_dilution = EXCLUDED.dna_vol_for_dilution,
                        buffer_vol_to_be_added = EXCLUDED.buffer_vol_to_be_added,
                        conc_of_amplicons = EXCLUDED.conc_of_amplicons,
                        vol_for_fragmentation = EXCLUDED.vol_for_fragmentation,
                        test_name = EXCLUDED.test_name,
                        hospital_name = EXCLUDED.hospital_name,
                        lib_prep_date = EXCLUDED.lib_prep_date,
                        sample_id = EXCLUDED.sample_id,
                        batch_id = EXCLUDED.batch_id,
                        pool_no = EXCLUDED.pool_no,
                        total_vol_for_20nm = EXCLUDED.total_vol_for_20nm,
                        lib_vol_for_20nm = EXCLUDED.lib_vol_for_20nm,
                        nfw_volu_for_20nm = EXCLUDED.nfw_volu_for_20nm,
                        vol_for_40nm_percent_pooling = EXCLUDED.vol_for_40nm_percent_pooling,
                        volume_from_40nm_for_total_25ul_pool = EXCLUDED.volume_from_40nm_for_total_25ul_pool,
                        nm_conc = EXCLUDED.nm_conc,
                        size = EXCLUDED.size,
                        one_tenth_of_nm_conc = EXCLUDED.one_tenth_of_nm_conc,
                        plate_designation = EXCLUDED.plate_designation,
                        pool_conc = EXCLUDED.pool_conc,
                        lib_qubit_for_2nm = EXCLUDED.lib_qubit_for_2nm,
                        nm_conc_for_2nm = EXCLUDED.nm_conc_for_2nm,
                        lib_vol_for_2nm = EXCLUDED.lib_vol_for_2nm,
                        nfw_vol_for_2nm = EXCLUDED.nfw_vol_for_2nm,
                        total_vol_for_2nm = EXCLUDED.total_vol_for_2nm,
                        size_for_2nm = EXCLUDED.size_for_2nm,
                        i5_index_forward = EXCLUDED.i5_index_forward
                    WHERE pool_info.internal_id = $14`,
                    [
                        sanitized.qubit_dna, sanitized.data_required, sanitized.well, sanitized.i7_index,
                        sanitized.i5_index_reverse, sanitized.dna_vol_for_dilution, sanitized.buffer_vol_to_be_added,
                        sanitized.conc_of_amplicons, sanitized.vol_for_fragmentation, testName, hospital_name,
                        sanitized.lib_prep_date, sample_id, internal_id, sanitized.batch_id,
                        sanitized.pool_no, sanitized.total_vol_for_20nm || null, sanitized.lib_vol_for_20nm || null,
                        sanitized.nfw_volu_for_20nm || null, sanitized.vol_for_40nm_percent_pooling || null,
                        sanitized.volume_from_40nm_for_total_25ul_pool || null, sanitized.nm_conc || null,
                        sanitized.size || null, sanitized.one_tenth_of_nm_conc || null,
                        sanitized.plate_designation || null, sanitized.pool_conc || null, sanitized.lib_qubit_for_2nm || null,
                        sanitized.nm_conc_for_2nm || null, sanitized.lib_vol_for_2nm || null,
                        sanitized.nfw_vol_for_2nm || null, sanitized.total_vol_for_2nm || null,
                        sanitized.size_for_2nm || null, sanitized.i5_index_forward || null
                    ]
                );
                await pool.query(
                    `UPDATE master_sheet SET qubit_dna = $1, data_required = $2,
                        well = $3, i7_index = $4, i5_index_reverse = $5,
                        dna_vol_for_dilution = $6, buffer_vol_to_be_added = $7,
                        conc_of_amplicons = $8, vol_for_fragmentation = $9,
                        lib_prep_date = $10, pool_no = $11,
                        total_vol_for_20nm = $12, lib_vol_for_20nm = $13,
                        nfw_volu_for_20nm = $14, vol_for_40nm_percent_pooling = $15,
                        volume_from_40nm_for_total_25ul_pool = $16,
                        nm_conc = $17, size = $18, one_tenth_of_nm_conc = $19,
                        plate_designation = $20, pool_conc = $21, lib_qubit_for_2nm = $25,
                        nm_conc_for_2nm = $26, lib_vol_for_2nm = $27,
                        nfw_vol_for_2nm = $28, total_vol_for_2nm = $29,
                        size_for_2nm = $30, i5_index_forward = $31
                        WHERE internal_id = $22 AND test_name = $23 AND hospital_name = $24`,
                    [
                        sanitized.qubit_dna, sanitized.data_required, sanitized.well, sanitized.i7_index,
                        sanitized.i5_index_reverse, sanitized.dna_vol_for_dilution, sanitized.buffer_vol_to_be_added,
                        sanitized.conc_of_amplicons, sanitized.vol_for_fragmentation, sanitized.lib_prep_date, sanitized.pool_no,
                        sanitized.total_vol_for_20nm || null, sanitized.lib_vol_for_20nm || null,
                        sanitized.nfw_volu_for_20nm || null, sanitized.vol_for_40nm_percent_pooling || null,
                        sanitized.volume_from_40nm_for_total_25ul_pool || null, sanitized.nm_conc || null,
                        sanitized.size || null, sanitized.one_tenth_of_nm_conc || null,
                        sanitized.plate_designation || null, sanitized.pool_conc || null,
                        internal_id, testName, hospital_name, sanitized.lib_qubit_for_2nm || null,
                        sanitized.nm_conc_for_2nm || null, sanitized.lib_vol_for_2nm || null,
                        sanitized.nfw_vol_for_2nm || null, sanitized.total_vol_for_2nm || null,
                        sanitized.size_for_2nm || null, sanitized.i5_index_forward || null
                    ]
                );
                response.push({ message: 'Data updated successfully', status: 200 });
            }
        }
        return NextResponse.json(response);
    }
    catch (error) {
        console.error("Error in UPDATE /api/pool-data:", error);
        return NextResponse.json({
            message: 'An error occurred while processing your request.',
            status: 500
        });
    }
}

export function toNumberOrNull(value) {
    return value === "" || value === undefined ? null : Number(value);
}