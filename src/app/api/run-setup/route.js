import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

function getUniqueSampleCount(ids = []) {
    const baseIds = ids.map(id => id.replace(/-DNA$/i, '').replace(/-RNA$/i, ''));
    return new Set(baseIds).size;
}

export async function POST(request) {
    const body = await request.json();
    const { setup } = body;
    try {
        // let run_id;
        const response = [];
        if (!setup) {
            response.push({
                message: "No setup provided.",
                status: 404
            });
        }
        // console.log('table_data', setup.table_data);
        // const { rows } = await pool.query(
        //     `SELECT run_id FROM run_setup WHERE hospital_name = $1 ORDER BY CAST(SUBSTRING(run_id FROM '[0-9]+$') AS INTEGER) DESC LIMIT 1;`,
        //     [setup.hospital_name]
        // );

        const idFormatRes = await pool.query(
            `SELECT run_id_prefix, internal_id_separator, run_id_pad_length, run_id_last_seq FROM id_format WHERE hospital_name = $1`,
            [setup.hospital_name]
        );

        if (idFormatRes.rows.length === 0) {
            return NextResponse.json([{ message: "No id_format found for hospital", status: 404 }]);
        }

        const { run_id_prefix, internal_id_separator, run_id_pad_length, run_id_last_seq } = idFormatRes.rows[0];

        // Increment sequence
        const nextRunSeq = Number(run_id_last_seq) + 1;

        // Update run_id_last_seq in id_format table
        await pool.query(
            `UPDATE id_format SET run_id_last_seq = $1 WHERE hospital_name = $2`,
            [nextRunSeq, setup.hospital_name]
        );

        // Build padded sequence
        const paddedSeq = String(nextRunSeq).padStart(Number(run_id_pad_length), "0");

        // Build run_id using internal_id_separator
        // const run_id = `${run_id_prefix}${internal_id_separator || ""}${paddedSeq}`;
        const run_id = setup.run_id

        await pool.query(
            `INSERT INTO run_setup (
              run_id,
              selected_application,
              seq_run_date,
              total_gb_available,
              instument_type,
              pool_size,
              pool_conc_run_setup,
              nm_cal,
              total_required,
              dinatured_lib_next_seq_550,
              total_volume_next_seq_550,
              loading_conc_550,
              lib_required_next_seq_550,
              buffer_volume_next_seq_550,
              final_pool_conc_vol_2nm_next_seq_1000_2000,
              rsbetween_vol_2nm_next_seq_1000_2000,
              total_volume_2nm_next_seq_1000_2000,
              vol_of_2nm_for_600pm_next_seq_1000_2000,
              vol_of_rs_between_for_600pm_next_seq_1000_2000,
              total_volume_600pm_next_seq_1000_2000,
              loading_conc_1000_2000,
              hospital_name,
              total_volume_2nm_next_seq_550,
              final_pool_conc_vol_2nm_next_seq_550,
              nfw_vol_2nm_next_seq_550,
              count,
              table_data,
              ht_buffer_next_seq_1000_2000,
              final_pool_vol_ul,
              flowcell
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
              $21, $22,$23,$24, $25, $26,$27,$28,$29,$30
            )`,
            [
                run_id,  //1
                setup.selected_application, //2
                setup.seq_run_date,//3
                setup.total_gb_available,//4
                setup.instument_type,//5
                setup.pool_size,//6
                setup.pool_conc_run_setup,//7
                setup.nm_cal,//8
                setup.total_required,//9
                setup.dinatured_lib_next_seq_550,//10
                setup.total_volume_next_seq_550,//11
                setup.loading_conc_550,//12
                setup.lib_required_next_seq_550,//13
                setup.buffer_volume_next_seq_550,//14
                setup.final_pool_conc_vol_2nm_next_seq_1000_2000,//15
                setup.rsbetween_vol_2nm_next_seq_1000_2000,//16
                setup.total_volume_2nm_next_seq_1000_2000,//17
                setup.vol_of_2nm_for_600pm_next_seq_1000_2000,//18
                setup.vol_of_rs_between_for_600pm_next_seq_1000_2000,//19
                setup.total_volume_600pm_next_seq_1000_2000,//20
                setup.loading_conc_1000_2000,//21
                setup.hospital_name,//22
                setup.total_volume_2nm_next_seq_550,//23
                setup.final_pool_conc_vol_2nm_next_seq_550,//24
                setup.nfw_vol_2nm_next_seq_550,//25
                getUniqueSampleCount(setup.internal_ids),//26
                JSON.stringify(setup.table_data),//27
                setup.ht_buffer_next_seq_1000_2000,//28
                setup.final_pool_vol_ul, //29
                setup.flowcell //30
            ]
        );

        if (setup.internal_ids && setup.internal_ids.length > 0) {
            for (const internalId of setup.internal_ids) {
                await pool.query(
                    `UPDATE master_sheet SET 
                  under_seq = 'Yes',
                  location = 'under_seq',
                  selected_application = $1,
                  seq_run_date = $2,
                  total_gb_available = $3,
                  instument_type = $4,
                  pool_size = $5,
                  pool_conc_run_setup = $6,
                  nm_cal = $7,
                  total_required = $8,
                  dinatured_lib_next_seq_550 = $9,
                  total_volume_next_seq_550 = $10,
                  loading_conc_550 = $11,
                  lib_required_next_seq_550 = $12,
                  buffer_volume_next_seq_550 = $13,
                  final_pool_conc_vol_2nm_next_seq_1000_2000 = $14,
                  rsbetween_vol_2nm_next_seq_1000_2000 = $15,
                  total_volume_2nm_next_seq_1000_2000 = $16,
                  vol_of_2nm_for_600pm_next_seq_1000_2000 = $17,
                  vol_of_rs_between_for_600pm_next_seq_1000_2000 = $18,
                  total_volume_600pm_next_seq_1000_2000 = $19,
                  loading_conc_1000_2000 = $20,
                  hospital_name = $21,
                  total_volume_2nm_next_seq_550 = $22,
                  final_pool_conc_vol_2nm_next_seq_550 = $23,
                  nfw_vol_2nm_next_seq_550 = $24,
                  count = $25,
                  table_data = $26,
                  ht_buffer_next_seq_1000_2000 = $27,
                  run_id = $28,
                    final_pool_vol_ul = $30,
                    flowcell = $31
                  WHERE internal_id = $29`,
                    [
                        setup.selected_application,//1
                        setup.seq_run_date,//2
                        setup.total_gb_available,//3
                        setup.instument_type,//4
                        setup.pool_size,//5
                        setup.pool_conc_run_setup,//6
                        setup.nm_cal,//7
                        setup.total_required,//8
                        setup.dinatured_lib_next_seq_550,//9
                        setup.total_volume_next_seq_550,//10
                        setup.loading_conc_550,//11
                        setup.lib_required_next_seq_550,//12
                        setup.buffer_volume_next_seq_550,//13
                        setup.final_pool_conc_vol_2nm_next_seq_1000_2000,//14
                        setup.rsbetween_vol_2nm_next_seq_1000_2000,//15
                        setup.total_volume_2nm_next_seq_1000_2000,//16
                        setup.vol_of_2nm_for_600pm_next_seq_1000_2000,//17
                        setup.vol_of_rs_between_for_600pm_next_seq_1000_2000,//18
                        setup.total_volume_600pm_next_seq_1000_2000,//19
                        setup.loading_conc_1000_2000,//20
                        setup.hospital_name,//21
                        setup.total_volume_2nm_next_seq_550,//22
                        setup.final_pool_conc_vol_2nm_next_seq_550,//23
                        setup.nfw_vol_2nm_next_seq_550,//24
                        getUniqueSampleCount(setup.internal_ids),//25
                        JSON.stringify(setup.table_data),//26
                        setup.ht_buffer_next_seq_1000_2000,//27
                        run_id,//28
                        internalId,//29
                        setup.final_pool_vol_ul,//30
                        setup.flowcell //31
                    ]
                );

                await pool.query(
                    `UPDATE pool_info SET run_id = $1 WHERE internal_id = $2`,
                    [run_id, internalId]
                );
                await pool.query(`INSERT INTO audit_logs (internal_id , comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, NOW(), $4)`, [internalId, `Sample moved to Under Sequencing`, setup.change_by, setup.hospital_name]);

                await pool.query(`INSERT INTO audit_logs (internal_id , comments, changed_by, changed_at, hospital_name) VALUES ($1, $2, $3, NOW(), $4)`, [internalId, `Run setup created with run_id: ${run_id}`, setup.change_by, setup.hospital_name]);
            }
        }

        // I am passing the array of the sample_id with the name sample_ids
        // console.log('sample_ids', setup.sample_ids);
        // if (setup.internal_ids && setup.internal_ids.length > 0) {
        //     const internalIds = setup.internal_ids.map(id => id); // Trim and filter out empty strings
        //     if (internalIds.length > 0) {
        //         for (const id of internalIds) {
        //             await pool.query(`UPDATE pool_info SET run_id = $1 WHERE internal_id = $2`, [run_id, id]);
        //             await pool.query(`UPDATE master_sheet SET under_seq = $1 , location = $2 WHERE internal_id = $3`, ['Yes', 'under_seq' ,id]);
        //             // await pool.query(`INSERT INTO audit_logs (internal_id , comments, change_by, change_date) VALUES ($1, $2, $3, NOW())`, [id, `Run setup created with run_id: ${run_id}`, setup.change_by]);
        //         }
        //     }
        // }

        response.push({
            message: "Run setup inserted successfully.",
            status: 200
        });
        return NextResponse.json(response);
    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({
            error: "An error occurred while processing your request.",
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const hospital_name = searchParams.get('hospital_name');
    const role = searchParams.get('role')
    try {
        // console.log('role', role);
        // console.log('hospital_name', hospital_name);
        const response = [];
        if (!hospital_name) {
            response.push({
                status: 400,
                message: "Organization Name is required"
            });
        }
        if (!role) {
            response.push({
                status: 400,
                message: "Role is required"
            });
        }
        if (role === 'SuperAdmin') {
            const { rows } = await pool.query(`SELECT run_id ,seq_run_date, instument_type,flowcell ,total_required, total_gb_available, selected_application, run_remarks,table_data, count FROM run_setup ORDER BY CAST(SUBSTRING(run_id FROM '[0-9]+$') AS INTEGER);`);
            if (rows.length === 0) {
                response.push({
                    status: 404,
                    message: "No run setups found"
                });
            } else {
                response.push({
                    status: 200,
                    data: rows
                });
            }
        }
        else {
            const { rows } = await pool.query(
                `SELECT run_id, total_required, total_gb_available, selected_application,instument_type, flowcell,table_data, seq_run_date,count,run_remarks FROM run_setup WHERE hospital_name = $1 ORDER BY CAST(SUBSTRING(run_id FROM '[0-9]+$') AS INTEGER);`,
                [hospital_name]
            );
            if (rows.length === 0) {
                response.push({
                    status: 404,
                    message: "No run setups found for the provided Organization Name"
                });
            } else {
                response.push({
                    status: 200,
                    data: rows
                });
            }
        }
        return NextResponse.json(response);
    } catch (error) {
        console.log('error', error);
        return NextResponse.json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { run_id, run_remarks } = body;
        const response = [];
        if (!run_id || !run_remarks) {
            response.push({
                status: 400,
                message: "Run ID and Remarks are required"
            });
            return NextResponse.json(response);
        }
        const { rows } = await pool.query(
            `UPDATE run_setup SET run_remarks = $1 WHERE run_id = $2 RETURNING *;`,
            [run_remarks, run_id]
        );

        if (rows.length === 0) {
            response.push({
                status: 404,
                message: "Run setup not found"
            });
        }
        else {
            await pool.query(`UPDATE master_sheet SET run_remarks = $1 WHERE run_id = $2`, [run_remarks, run_id]);
            response.push({
                status: 200,
                message: "Run remarks updated successfully",
                data: rows[0]
            });
        }
        return NextResponse.json(response);
    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
}