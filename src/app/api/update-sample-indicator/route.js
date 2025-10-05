import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();
    const { rows, testName, hospital_name } = body;
    try {
        const response = []
        let pool_no = 'P_001';
        const poolData = await pool.query('SELECT pool_no FROM pool_info');
        if (poolData.rows.length === 0) {
            pool_no = 'P_001'; // Default pool number if no records exist
        }
        else {
            const lastPoolNo = poolData.rows[0].pool_no;
            const lastNumber = parseInt(lastPoolNo.split('_')[1], 10);
            const newNumber = lastNumber + 1;
            pool_no = `P_${newNumber.toString().padStart(3, '0')}`; // Increment and format the pool number
        }

        if (!hospital_name) {
            response.push({
                message: 'Organization name is required',
                status: 400
            });
        }

        // console.log('rows', rows);
        // console.log('hospital_name', hospital_name);
        // console.log('testName', testName);

        if (testName === "Myeloid") {

            for (let i = 0; i < rows.length; i++) {
                const sample_id = rows[i].sample_id;
                const qubit_dna = rows[i].qubit_dna;
                const data_required = rows[i].data_required;
                const conc_rxn = rows[i].conc_rxn;
                const barcode = rows[i].barcode;
                const i5_index_reverse = rows[i].i5_index_reverse;
                const i7_index = rows[i].i7_index;
                const lib_qubit = rows[i].lib_qubit;
                const nm_conc = rows[i].nm_conc;
                const lib_vol_for_20nm = rows[i].lib_vol_for_20nm;
                const nfw_volu_for_20nm = rows[i].nfw_volu_for_20nm;
                const total_vol_for_20nm = rows[i].total_vol_for_20nm;
                const size = rows[i].size;
                const tapestation_conc = rows[i].tapestation_conc;
                const tapestation_size = rows[i].tapestation_size;

                if (!sample_id) {
                    response.push({
                        message: 'Sample Id is required',
                        status: 400
                    });
                }
                else if (!qubit_dna || !data_required || !conc_rxn || !barcode || !i5_index_reverse || !i7_index || !lib_qubit || !nm_conc || !lib_vol_for_20nm || !nfw_volu_for_20nm || !total_vol_for_20nm) {
                    response.push({
                        message: 'All fields are required',
                        status: 400
                    });
                }
                const data = await pool.query('SELECT sample_id FROM pool_info WHERE sample_id = $1', [sample_id]);
                const sampleExists = data.rows.length > 0;
                if (sampleExists) {
                    await pool.query(
                        `UPDATE pool_info SET qubit_dna = $2, data_required = $3, conc_rxn = $4, barcode = $5, i5_index_reverse = $6, i7_index = $7, lib_qubit = $8, nm_conc = $9, lib_vol_for_20nm = $10, nfw_volu_for_20nm = $11, total_vol_for_20nm = $12, pool_no = $13, size = $14, test_name = $15, hospital_name = $16, tapestation_size =$17 , tapestation_conc = $18 WHERE sample_id = $1`,
                        [sample_id, qubit_dna, data_required, conc_rxn, barcode, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, pool_no, size, testName, hospital_name , tapestation_size, tapestation_conc]
                    );
                    response.push({
                        message: 'data updated successfully',
                        status: 200
                    });
                }
                else {
                    await pool.query(
                        `INSERT INTO pool_info (sample_id, qubit_dna, data_required, conc_rxn, barcode, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, pool_no, size, test_name, hospital_name , tapestation_size, tapestation_conc)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11, $12, $13, $14, $15,$16, $17, $18)`,
                        [sample_id, qubit_dna, data_required, conc_rxn, barcode, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, pool_no, size, testName, hospital_name , tapestation_size, tapestation_conc]
                    );
                    response.push({
                        message: 'Sample indicator updated successfully',
                        status: 200
                    });
                }

                // if (!sample_id) {
                //     const data = await pool.query('SELECT sample_id FROM pool_info WHERE sample_id = $1', [sample_id]);
                //     const sampleExists = data.rows.length > 0;
                //     if (!sampleExists) {
                //         await pool.query(
                //             `INSERT INTO pool_info (sample_id, qubit_dna, data_required, conc_rxn, barcode, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, pool_no,size,test_name, hospital_name)
                //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11, $12, $13, $14, $15, $16)`,
                //             [sample_id, qubit_dna, data_required, conc_rxn, barcode, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, pool_no, size, testName, hospital_name]
                //         );

                //         response.push({
                //             message: 'Sample indicator updated successfully',
                //             status: 200
                //         });
                //     } 
                // } else {
                //     await pool.query(`UPDATE pool_info SET qubit_dna = $2, data_required = $3, conc_rxn = $4, barcode = $5, i5_index_reverse = $6, i7_index = $7, lib_qubit = $8, nm_conc = $9, lib_vol_for_20nm = $10, nfw_volu_for_20nm = $11, total_vol_for_20nm = $12, pool_no = $13, size = $14, test_name = $15, hospital_name = $16 WHERE sample_id = $1`,
                //         [sample_id, qubit_dna, data_required, conc_rxn, barcode, i5_index_reverse, i7_index, lib_qubit, nm_conc, lib_vol_for_20nm, nfw_volu_for_20nm, total_vol_for_20nm, pool_no, size, testName, hospital_name]);
                //     response.push({
                //         message:'data updated successfully',
                //         status: 200
                //     });
                // }
            }
        }
        else if (testName === "WES" ||
            testName === "Carrier Screening" ||
            testName === "CES" ||
            testName === "Cardio Comprehensive (Screening)" ||
            testName === "Cardio Metabolic Syndrome (Screening)" ||
            testName === "WES + Mito" ||
            testName === "CES + Mito" ||
            testName === "HRR" ||
            testName === "HCP" ||
            testName === "Cardio Comprehensive Myopathy") {

            for (let i = 0; i < rows.length; i++) {
                const sample_id = rows[i].sample_id;
                const qubit_dna = rows[i].qubit_dna;
                const data_required = rows[i].data_required;
                const per_rxn_gdna = rows[i].per_rxn_gdna;
                const volume = rows[i].volume;
                const gdna_volume_3x = rows[i].gdna_volume_3x;
                const nfw = rows[i].nfw;
                const plate_designation = rows[i].plate_designation;
                const well = rows[i].well;
                const i5_index_reverse = rows[i].i5_index_reverse;
                const i7_index = rows[i].i7_index;
                const qubit_lib_qc_ng_ul = rows[i].qubit_lib_qc_ng_ul;
                const stock_ng_ul = rows[i].stock_ng_ul;
                const lib_vol_for_hyb = rows[i].lib_vol_for_hyb;
                const gb_per_sample = rows[i].gb_per_sample;
                const pool_conc = rows[i].pool_conc;
                const size = rows[i].size;
                const nm_conc = rows[i].nm_conc;
                const one_tenth_of_nm_conc = rows[i].one_tenth_of_nm_conc;
                const total_vol_for_20nm = rows[i].total_vol_for_20nm;
                const lib_vol_for_20nm = rows[i].lib_vol_for_20nm;
                const nfw_volu_for_20nm = rows[i].nfw_volu_for_20nm;

                if (!sample_id) {
                    await pool.query(`UPDATE pool_info SET qubit_dna = $2, data_required = $3, per_rxn_gdna = $4, volume = $5, gdna_volume_3x = $6, nfw = $7, plate_designation = $8, well = $9, i5_index_reverse = $10, i7_index = $11, qubit_lib_qc_ng_ul = $12, stock_ng_ul = $13, lib_vol_for_hyb = $14, gb_per_sample = $15, pool_no = $16, test_name = $17, hospital_name = $18, pool_conc = $19, size = $20, nm_conc = $21, one_tenth_of_nm_conc = $22, total_vol_for_20nm = $23, lib_vol_for_20nm = $24, nfw_volu_for_20nm = $25 WHERE sample_id = $1`,
                        [sample_id, qubit_dna, data_required, per_rxn_gdna, volume, gdna_volume_3x, nfw, plate_designation, well, i5_index_reverse, i7_index, qubit_lib_qc_ng_ul, stock_ng_ul, lib_vol_for_hyb, gb_per_sample, pool_no, testName, hospital_name, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm]);
                    response.push({
                        message: 'Data updated successfully',
                        status: 200
                    });
                }
                //  error de do agr user upr me se koi bhi field ko nhi dega to agr ek bhi field me value hai to error nhi aayega
                else if (!qubit_dna || !per_rxn_gdna || !volume || !gdna_volume_3x || !nfw || !plate_designation || !well || !i5_index_reverse || !i7_index || !qubit_lib_qc_ng_ul || !stock_ng_ul || !lib_vol_for_hyb) {
                    response.push({
                        message: 'All fields are required',
                        status: 400
                    });
                }
                const data = await pool.query('SELECT sample_id FROM pool_info WHERE sample_id = $1', [sample_id]);
                const sampleExists = data.rows.length > 0;
                if (sampleExists) {
                    await pool.query(
                        `UPDATE pool_info SET qubit_dna = $2, data_required = $3, per_rxn_gdna = $4, volume = $5, gdna_volume_3x = $6, nfw = $7, plate_designation = $8, well = $9, i5_index_reverse = $10, i7_index = $11, qubit_lib_qc_ng_ul = $12, stock_ng_ul = $13, lib_vol_for_hyb = $14, gb_per_sample = $15, pool_no = $16, test_name = $17, hospital_name = $18, pool_conc = $19, size = $20, nm_conc = $21, one_tenth_of_nm_conc = $22, total_vol_for_20nm = $23, lib_vol_for_20nm = $24, nfw_volu_for_20nm = $25  WHERE sample_id = $1`,
                        [sample_id, qubit_dna, data_required, per_rxn_gdna, volume, gdna_volume_3x, nfw, plate_designation, well, i5_index_reverse, i7_index, qubit_lib_qc_ng_ul, stock_ng_ul, lib_vol_for_hyb, gb_per_sample, pool_no, testName, hospital_name, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm]
                    );
                    response.push({
                        message: 'data updated successfully',
                        status: 200
                    });
                }
                else {
                    await pool.query(
                        `INSERT INTO pool_info (sample_id, qubit_dna, data_required, per_rxn_gdna, volume, gdna_volume_3x, nfw, plate_designation, well, i5_index_reverse, i7_index, qubit_lib_qc_ng_ul, stock_ng_ul, lib_vol_for_hyb, gb_per_sample, test_name, pool_no, hospital_name)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                        [sample_id, qubit_dna, data_required, per_rxn_gdna, volume, gdna_volume_3x, nfw, plate_designation, well, i5_index_reverse, i7_index, qubit_lib_qc_ng_ul, stock_ng_ul, lib_vol_for_hyb, gb_per_sample, testName, pool_no, hospital_name]
                    );
                    response.push({
                        message: 'Sample indicator updated successfully',
                        status: 200
                    });
                }
            }
        }
        else if (testName === "SGS" || testName === "HLA") {
            for (let i = 0; i < rows.length; i++) {
                const sample_id = rows[i].sample_id;
                const qubit_dna = rows[i].qubit_dna;
                const data_required = rows[i].data_required;
                const well = rows[i].well;
                const i7_index = rows[i].i7_index;
                const sample_volume = rows[i].sample_volume;
                const qubit_lib_qc_ng_ul = rows[i].qubit_lib_qc_ng_ul;
                const pooling_volume = rows[i].pooling_volume;
                const pool_conc = rows[i].pool_conc;
                const size = rows[i].size;
                const nm_conc = rows[i].nm_conc;
                const one_tenth_of_nm_conc = rows[i].one_tenth_of_nm_conc;
                const total_vol_for_20nm = rows[i].total_vol_for_20nm;
                const lib_vol_for_20nm = rows[i].lib_vol_for_20nm;
                const nfw_volu_for_20nm = rows[i].nfw_volu_for_20nm;

                if (!sample_id) {
                    response.push({
                        message: 'Sample Id is required',
                        status: 400
                    });
                }
                else if (!qubit_dna && !well && !i7_index && !sample_volume && !qubit_lib_qc_ng_ul && !pooling_volume && !pool_conc && !size && !nm_conc && !one_tenth_of_nm_conc && !total_vol_for_20nm && !lib_vol_for_20nm && !nfw_volu_for_20nm) {
                    response.push({
                        message: 'All fields are required',
                        status: 400
                    });
                }
                const data = await pool.query('SELECT sample_id FROM pool_info WHERE sample_id = $1', [sample_id]);
                const sampleExists = data.rows.length > 0;
                if (sampleExists) {
                    await pool.query(
                        `UPDATE pool_info SET qubit_dna = $2, data_required = $3, well = $4, i7_index = $5, sample_volume = $6, qubit_lib_qc_ng_ul = $7, pooling_volume = $8, pool_conc = $9, size = $10, nm_conc = $11, one_tenth_of_nm_conc = $12, total_vol_for_20nm = $13, lib_vol_for_20nm = $14, nfw_volu_for_20nm = $15, pool_no = $16, test_name = $17, hospital_name = $18 WHERE sample_id = $1`,
                        [sample_id, qubit_dna, data_required, well, i7_index, sample_volume, qubit_lib_qc_ng_ul, pooling_volume, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, pool_no, testName, hospital_name]
                    );
                    response.push({
                        message: 'data updated successfully',
                        status: 200
                    });
                }
                else {
                    await pool.query(
                        `INSERT INTO pool_info (sample_id, qubit_dna, data_required, well, i7_index, sample_volume, qubit_lib_qc_ng_ul, pooling_volume, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, test_name, pool_no, hospital_name)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                        [sample_id, qubit_dna, data_required, well, i7_index, sample_volume, qubit_lib_qc_ng_ul, pooling_volume, pool_conc, size, nm_conc, one_tenth_of_nm_conc, total_vol_for_20nm, lib_vol_for_20nm, nfw_volu_for_20nm, testName, pool_no, hospital_name]
                    );
                    response.push({
                        message: 'Sample indicator updated successfully',
                        status: 200
                    });
                }
            }
        }
        else {
            response.push({
                message: 'Invalid test name',
                status: 400
            });
        }
        return NextResponse.json(response)
    }
    catch (e) {
        console.error("Error updating sample indicator:", e);
        return NextResponse.json({ error: "Failed to update sample indicator" }, { status: 500 });
    }
}

export async function PUT(request) {
    const body = await request.json();
    const { sample_id, sample_indicator, indicator_status } = body.data;
    // console.log('body', body);
    try {
        const response = [];

        if (sample_indicator === 'dna_isolation') {
            await pool.query(`UPDATE master_sheet SET dna_isolation = $2 WHERE sample_id = $1`, [sample_id, indicator_status]);
            response.push({
                message: 'Sample indicator updated successfully',
                indicator_status: indicator_status,
                status: 200
            });
        }
        else if (sample_indicator === 'lib_prep') {
            await pool.query(`UPDATE master_sheet SET lib_prep = $2 WHERE sample_id = $1`, [sample_id, indicator_status]);
            response.push({
                message: 'Sample indicator updated successfully',
                indicator_status: indicator_status,
                status: 200
            });
        }
        else if (sample_indicator === 'under_seq') {
            await pool.query(`UPDATE master_sheet SET under_seq = $2 WHERE sample_id = $1`, [sample_id, indicator_status]);
            response.push({
                message: 'Sample indicator updated successfully',
                status: 200
            });
        }
        else if (sample_indicator === 'seq_completed') {
            await pool.query(`UPDATE master_sheet SET seq_completed = $2 WHERE sample_id = $1`, [sample_id, indicator_status]);
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
