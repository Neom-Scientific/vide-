import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const response = [];
    const { searchParams } = new URL(request.url);
    const parseList = (param) => {
      const val = searchParams.get(param);
      return val ? val.split(',').map(v => v.trim()).filter(Boolean) : [];
    };

    const sample_ids = parseList('sample_id');
    const test_names = parseList('test_name');
    const run_ids = parseList('run_id');
    const sample_statuses = parseList('sample_status');
    const sample_indicators = parseList('sample_indicator');
    const doctor_names = parseList('doctor_name');
    const dept_names = parseList('dept_name');
    const from_dates = parseList('from_date');
    const to_dates = parseList('to_date');
    const hospital_names = parseList('hospital_name');
    const forParam = searchParams.get('for')
    let query;

    // Validate input
    if (
      !sample_ids.length && !test_names.length && !run_ids.length &&
      !sample_statuses.length && !sample_indicators.length &&
      !doctor_names.length && !dept_names.length && !from_dates.length && !to_dates.length && !hospital_names.length
    ) {
      response.push({
        status: 400,
        message: "Please provide at least one search parameter"
      });
    }

    // Validate date range
    if (from_dates.length && to_dates.length) {
      const fromDate = new Date(from_dates[0]);
      const toDate = new Date(to_dates[0]);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        response.push({
          status: 400,
          message: "Invalid date format"
        });
      }
      if (fromDate > toDate) {
        response.push({
          status: 400,
          message: "From date cannot be greater than To date"
        })
      }
    }

    // Build query
    let where = [];
    let values = [];
    let idx = 1;

    const addFilter = (field, arr) => {
      if (arr.length) {
        where.push(`${field} IN (${arr.map(() => `$${idx++}`).join(',')})`);
        values.push(...arr);
      }
    };

    addFilter('sample_id', sample_ids);
    // addFilter('test_name', test_names);
    if (test_names.length) {
      let testNameConditions = [];
      test_names.forEach((name) => {
        testNameConditions.push(`test_name = $${idx++}`);
        values.push(name);
        testNameConditions.push(`test_name = $${idx++}`);
        values.push(`${name} + Mito`);
      });
      where.push(`(${testNameConditions.join(' OR ')})`);
    }
    addFilter('run_id', run_ids);
    if (sample_statuses.length) {
      sample_statuses.forEach(status => {
        if (status === 'Not Accepted') {
          where.push(`specimen_quality = $${idx++}`);
          values.push('Not Accepted');
        } else {
          where.push(`sample_status = $${idx++}`);
          values.push(status);
        }
      });
    }
    addFilter('doctor_name', doctor_names);
    addFilter('dept_name', dept_names);
    addFilter('hospital_name', hospital_names); // Add hospital_name filter

    // Handle sample_indicator dynamically
    if (sample_indicators.length) {
      sample_indicators.forEach((indicator) => {
        where.push(`${indicator} = $${idx++}`);
        values.push("Yes");
      });
    }

    if (from_dates.length && to_dates.length) {
      const fromDate = from_dates[0];
      let toDate = new Date(to_dates[0]);
      toDate.setDate(toDate.getDate() + 1);
      const toDateStr = toDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
      where.push(`registration_date >= $${idx++} AND registration_date < $${idx++}`);
      values.push(fromDate, toDateStr);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    if (forParam === 'process') {
      query = `SELECT * FROM master_sheet ${whereClause} ORDER BY registration_date DESC`;
    } else if (forParam === 'report') {
      const reportWhereClause = whereClause ? `${whereClause} AND seq_run_date IS NOT NULL` : `WHERE seq_run_date IS NOT NULL`;
      query = `SELECT * FROM master_sheet ${reportWhereClause} ORDER BY registration_date DESC`;
    }

    const data = await pool.query(query, values);

    if (data.rows.length === 0) {
      response.push({
        status: 404,
        message: "No data found"
      });
    } else {
      response.push({
        status: 200,
        data: data.rows
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}