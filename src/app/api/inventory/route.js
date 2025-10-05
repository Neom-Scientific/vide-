import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();
    const { sku, kit_name, group_classification, mrp, number_of_rxn, list_price, manufacturer, purchase_price, hospital_name } = body;
    try {
        const response = []
        if (!hospital_name) {
            response.push({
                message: 'Hospital name is required',
                status: 400
            })
            return NextResponse.json(response);
        }
        const mrpClean = cleanNumber(mrp);
        const listPriceClean = cleanNumber(list_price);
        const purchasePriceClean = cleanNumber(purchase_price);
        const { rows } = await pool.query(`
            INSERT INTO inventories (sku, kit_name, group_classification, mrp, number_of_rxn, list_price, manufacturer ,hospital_name, purchase_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [sku, kit_name, group_classification, mrpClean, number_of_rxn, listPriceClean, manufacturer, hospital_name, purchasePriceClean]);
        if (rows.length > 0) {
            response.push({
                message: 'New item added successfully',
                status: 200
            });
        }
        else {
            response.push({
                message: 'Failed to add new item',
                status: 500
            });
        }
        return NextResponse.json(response);


    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({
            error: 'failed to add new item',
            message: error.message,
            status: 500
        })
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const hospital_name = searchParams.get('hospital_name');
    try {
        const response = [];
        if (!hospital_name) {
            response.push({
                message: 'Hospital name is required',
                status: 400
            });
            return NextResponse.json(response);
        }
        const { rows } = await pool.query(`SELECT * FROM inventories WHERE hospital_name = $1`, [hospital_name]);
        if (rows.length > 0) {
            response.push({
                message: 'Inventory items fetched successfully',
                status: 200,
                data: rows
            });
        } else {
            response.push({
                message: 'No inventory items found for the specified hospital',
                status: 404
            });
        }
        return NextResponse.json(response);
    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({
            error: 'failed to fetch inventory items',
            message: error.message,
            status: 500
        });
    }
}

export async function PUT(request) {
    const body = await request.json();
    const { id, sku, kit_name, group_classification, mrp, number_of_rxn, list_price, manufacturer, purchase_price, hospital_name } = body;
    try {
        const response = [];
        if (!id) {
            response.push({
                message: 'Item ID is required for update',
                status: 400
            });
            return NextResponse.json(response);
        }
        if (!hospital_name) {
            response.push({
                message: 'Hospital name is required',
                status: 400
            });
            return NextResponse.json(response);
        }
        const mrpClean = cleanNumber(mrp);
        const listPriceClean = cleanNumber(list_price);
        const purchasePriceClean = cleanNumber(purchase_price);
        const { rows } = await pool.query(`
            UPDATE inventories 
            SET sku = $1, kit_name = $2, group_classification = $3, mrp = $4, number_of_rxn = $5, list_price = $6, manufacturer = $7, purchase_price = $8
            WHERE id = $9 AND hospital_name = $10 RETURNING *`, [sku, kit_name, group_classification, mrpClean, number_of_rxn, listPriceClean, manufacturer, purchasePriceClean, id, hospital_name]);
        if (rows.length > 0) {
            response.push({
                message: 'Item updated successfully',
                status: 200
            });
        } else {
            response.push({
                message: 'No item found with the specified ID for the given hospital',
                status: 404
            });
        }
        return NextResponse.json(response);
    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({
            error: 'failed to update item',
            message: error.message,
            status: 500
        });
    }
}

const cleanNumber = (value) => {
    if (typeof value === 'string') {
        return parseFloat(value.replace(/,/g, ''));
    }
    return value;
}