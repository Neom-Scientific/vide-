import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { data } = body;

        if (!data || data.length === 0) {
            return NextResponse.json({
                status: 400,
                message: 'No data provided to generate the Excel file.',
            });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sample Data');

        // Dynamically generate column headers based on the keys in the first row of the data
        const columns = Object.keys(data[0]).map((key) => ({
            header: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), // Format headers
            key: key,
            width: 20,
        }));

        worksheet.columns = columns;

        // Transform data to replace "Yes" and "No" with symbols and format dates
        const transformedData = data.map((item) => {
            const updatedItem = { ...item };

            // Format "Yes" and "No" values
            ['dna_isolation', 'lib_prep', 'under_seq', 'seq_completed'].forEach((key) => {
                if (updatedItem[key] !== undefined) {
                    updatedItem[key] = updatedItem[key] === 'Yes' ? '✔' : '✘';
                }
            });

            // Format dates to yyyy/mm/dd
            ['registration_date', 'seq_run_date', 'phenotype_rec_date'].forEach((key) => {
                if (updatedItem[key]) {
                    const date = new Date(updatedItem[key]);
                    updatedItem[key] = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                }
            });

            return updatedItem;
        });

        // Add transformed data rows
        transformedData.forEach((item) => {
            worksheet.addRow(item);
        });

        // Write the Excel file to a buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Return the buffer as a downloadable file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=sample_data.xlsx',
            },
        });
    } catch (error) {
        console.error('Error generating Excel file:', error);
        return NextResponse.json({
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}