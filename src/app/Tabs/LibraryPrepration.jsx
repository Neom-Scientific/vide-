import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch } from "react-redux";
import { setActiveTab } from "@/lib/redux/slices/tabslice";
import Cookies from "js-cookie";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { isEqual, remove } from "lodash";


const LibraryPrepration = () => {
  const [message, setMessage] = useState(0);
  const [tableRows, setTableRows] = useState([]);
  const [testName, setTestName] = useState("");
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedSampleIndicator, setSelectedSampleIndicator] = useState('');
  const [showPooledFields, setShowPooledFields] = useState(false);
  const [pooledValues, setPooledValues] = useState({});
  const [selectedCells, setSelectedCells] = useState([]);
  const [getTheTestNames, setGetTheTestNames] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [bulkValue, setBulkValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pooledRowData, setPooledRowData] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [DialogOpen, setDialogOpen] = useState(false);
  // Ensure a default user cookie exists (only set if not already present)
  // const defaultUser = {
  //   username: "ankit",
  //   email: "ankit@strivebiocorp.com",
  //   hospital_name: "SOI",
  //   hospital_id: "101",
  //   role: "AdminUser",
  //   user_login: 57,
  //   name: "Ankit Bhadauriya",
  //   created_at: "2025-06-08T04:00:00.000Z",
  //   enable_management: "Yes"
  // };
  // if (typeof window !== "undefined" && !Cookies.get('vide_user')) {
  //   Cookies.set('vide_user', JSON.stringify(defaultUser), { expires: 7, path: '/' });
  // }
  const user = JSON.parse(Cookies.get('vide_user') || '{}');
  const testNameRef = useRef(testName);
  const [manualPlateRows, setManualPlateRows] = useState(new Set());
  const [manualWellRows, setManualWellRows] = useState(new Set());
  const [syncFirstRow, setSyncFirstRow] = useState(true);
  const [dialogRowInfo, setDialogRowInfo] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    testNameRef.current = testName;
  }, [testName]);


  const allColumns = [
    { key: 'id', label: 'S.No.' },
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'pool_no', label: 'Pool No.' },
    { key: 'sample_id', label: 'Patient ID' },
    { key: 'registration_date', label: 'Registration Date' },
    { key: 'internal_id', label: 'Lab ID' },
    { key: 'test_name', label: 'Test Name' },
    { key: 'sample_type', label: 'Sample Type' },
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_name', label: 'Client Name' },
    { key: 'patient_name', label: 'Patient Name' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'father_husband_name', label: 'Father/Mother Name' },
    { key: 'docter_name', label: 'Doctor Name' },
    { key: 'email', label: 'Doctor Email' },
    // { key: 'qubit_dna', label: 'Qubit DNA (ng/ul)' },
    { key: 'qubit_dna', label: 'Input Quant (ng/ul)' },
    { key: 'conc_rxn', label: 'conc/rxn (ng/rxn)' },
    { key: 'per_rxn_gdna', label: 'Per Rxn gDNA (ng/rxn)' },
    { key: 'volume', label: 'Volume (ul)' },
    { key: 'gdna_volume_3x', label: 'gDNA Volume (ul) (3X)' },
    { key: 'nfw', label: 'NFW (ul) (3x)' },
    { key: 'dna_vol_for_dilution', label: 'DNA Vol for Dilution (40ng/ul)' },
    { key: 'buffer_vol_to_be_added', label: 'Buffer Vol (ul)' },
    { key: 'conc_of_amplicons', label: 'Conc of Amplicons (ng/ul)' },
    { key: 'vol_for_fragmentation', label: 'Volume for Fragmentation (ul)' },
    { key: 'plate_designation', label: 'Plate Designation' },
    { key: 'well', label: 'Well No./Barcode' },
    { key: 'i5_index_reverse', label: 'i5 (reverse)' },
    { key: 'i5_index_forward', label: 'i5 (forward)' },
    { key: 'i7_index', label: 'i7 index' },
    { key: 'lib_qubit', label: 'Lib Qubit ng/ml' },
    { key: 'qubit_lib_qc_ng_ul', label: 'Library Qubit (ng/ul)' },
    { key: 'lib_vol_for_hyb', label: 'Library Volume for Hyb (ul)' },
    { key: 'pooling_volume', label: 'Pooling Volume (ul)' },
    { key: 'pool_conc', label: 'Pooled Library Conc. (ng/ul)' },
    { key: 'size', label: 'Size (bp)' },
    { key: 'nm_conc', label: 'nM conc' },
    { key: 'lib_vol_for_20nm', label: 'Volume from Stock library for 20nM' },
    { key: 'nfw_volu_for_20nm', label: 'NFW Volume For 20nM' },
    { key: 'total_vol_for_20nm', label: 'Total Volume For 20nM' },
    { key: 'pool_5ul_myeloid', label: 'Pool (5ul Each)' },
    { key: 'pool_dna_rna_10ul', label: 'Pool DNA/RNA 10ul' },
    { key: 'tapestation_conc', label: 'TapeStation/Qubit QC ng/ul RNA/DNA Pool' },
    { key: 'tapestation_size', label: 'Average bp  Size' },
    { key: 'stock_ng_ul', label: 'Stock (ng/ul)' },
    { key: 'data_required', label: 'Data Required(GB)' },
    { key: 'vol_for_40nm_percent_pooling', label: '20nM vol. % pooling' },
    { key: 'volume_from_40nm_for_total_25ul_pool', label: 'Volume from 20nM for Total 25ul Pool' },
    { key: 'lib_qubit_for_2nm', label: 'Batch Qubit (ng/ul)' },
    { key: 'size_for_2nm', label: 'Average Size' },
    { key: 'nm_conc_for_2nm', label: 'nM Conc' },
    { key: 'lib_vol_for_2nm', label: 'Volume from Stock library for 2nM' },
    { key: 'nfw_vol_for_2nm', label: 'NFW Volume For 2nM' },
    { key: 'total_vol_for_2nm', label: 'Total Volume For 2nM' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'clinical_history', label: 'Clinical History' },

  ];


  const batchedColumns = [
    "lib_qubit_for_2nm",
    "size_for_2nm",
    "nm_conc_for_2nm",
    "lib_vol_for_2nm",
    "nfw_vol_for_2nm",
    "total_vol_for_2nm",
  ]

  const pooledColumns = [
    "pool_conc",
    "size",
    "nm_conc",
    "lib_vol_for_20nm",
    "nfw_volu_for_20nm",
    "total_vol_for_20nm",
  ];

  const finalPoolingColumns = ["vol_for_40nm_percent_pooling", "volume_from_40nm_for_total_25ul_pool"];

  const insertPooledColumns = (columns) => {
    const result = [];
    for (let col of columns) {
      if (col === "data_required") {
        result.push(...pooledColumns); // insert pooled columns before data_required
      }
      result.push(col);
    }
    return result;
  };

  const insertFinalPoolingColumns = (columns) => {
    const result = [];
    for (let col of columns) {
      result.push(col);
      if (col === "data_required") {
        result.push(...finalPoolingColumns); // insert final pooling columns after data_required
      }
    }
    return result
  }

  const getDefaultVisible = (testName) => {
    let baseCols = [];
    if (testName === "Myeloid") {
      baseCols = [
        "id",
        "sample_id",
        "registration_date",
        "internal_id",
        "test_name",
        "patient_name",
        "sample_type",
        "qubit_dna",
        "conc_rxn",
        "plate_designation",
        "well",
        "i5_index_forward",
        "i5_index_reverse",
        "i7_index",
        "size",
        "lib_qubit",
        "nm_conc",
        "total_vol_for_20nm",
        "lib_vol_for_20nm",
        "nfw_volu_for_20nm",
        "pool_5ul_myeloid",
        "pool_dna_rna_10ul",
        "tapestation_conc",
        "tapestation_size",
        "data_required",
        // "data_required",
        // Do NOT include pool_conc or finalPoolingColumns here
      ];
      return baseCols;
    } else if (
      testName === "WES" ||
      testName === "Carrier Screening" ||
      testName === "CES" ||
      testName === "Cardio Comprehensive (Screening)" ||
      testName === "Cardio Metabolic Syndrome (Screening)" ||
      testName === "Cardio Comprehensive Myopathy" ||
      testName === "WES + Mito" ||
      testName === "CES + Mito" ||
      testName === "HRR" ||
      testName === "HCP"
    ) {
      baseCols = [
        "select",
        "id",
        "batch_id",
        "pool_no",
        "sample_id",
        "registration_date",
        "internal_id",
        "test_name",
        "patient_name",
        "qubit_dna",
        "per_rxn_gdna",
        "volume",
        "gdna_volume_3x",
        "nfw",
        "plate_designation",
        "well",
        "i5_index_reverse",
        "i7_index",
        "qubit_lib_qc_ng_ul",
        "lib_vol_for_hyb",
        "data_required",
      ];
      return insertFinalPoolingColumns(insertPooledColumns(baseCols));
    } else if (testName === "SGS") {
      baseCols = [
        "select",
        "id",
        "batch_id",
        "pool_no",
        "sample_id",
        "registration_date",
        "internal_id",
        "test_name",
        "patient_name",
        "qubit_dna",
        "plate_designation",
        "well",
        "i7_index",
        "qubit_lib_qc_ng_ul",
        "pooling_volume",
        "data_required",
      ];
      return insertFinalPoolingColumns(insertPooledColumns(baseCols));
    }
    else if (testName === "HLA") {
      baseCols = [
        "select",
        "id",
        "batch_id",
        "pool_no",
        "sample_id",
        "registration_date",
        "internal_id",
        "test_name",
        "patient_name",
        "qubit_dna",
        "dna_vol_for_dilution",
        "buffer_vol_to_be_added",
        "conc_of_amplicons",
        "vol_for_fragmentation",
        "plate_designation",
        "well",
        "i5_index_reverse",
        "i7_index",
        "data_required",
      ];
      return insertFinalPoolingColumns(insertPooledColumns(baseCols));
    }
    return insertFinalPoolingColumns(insertPooledColumns(baseCols));
  };


  const [columnVisibility, setColumnVisibility] = useState(() => {
    const defaultVisible = getDefaultVisible(testName);
    const visibility = allColumns.reduce((acc, col) => {
      acc[col.key] = defaultVisible.includes(col.key);
      return acc;
    }, {});
    // Ensure select column visibility is set if needed
    if (defaultVisible.includes("select")) {
      visibility["select"] = true;
    }
    return visibility;
  });

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
    if (Object.keys(storedData).length === 0) {
      setMessage(1); // Set message to indicate no data available
    } else {
      setMessage(0); // Reset message if data is available
    }
  }, []);

  useEffect(() => {
    const fetchPoolInfo = async () => {
      try {
        const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
        // Fix: handle both array and object format for allInternalIds
        const allInternalIds = Object.values(storedData)
          .flatMap(val => {
            if (Array.isArray(val)) {
              return val.map(row => row.internal_id);
            } else if (val && Array.isArray(val.rows)) {
              return val.rows.map(row => row.internal_id);
            }
            return [];
          })
          .filter(Boolean);
        const testName = Object.keys(storedData)[0];

        // If local data exists for this testName, use it and do not overwrite
        if (testName && storedData[testName]) {
          if (Array.isArray(storedData[testName])) {
            setTableRows(sortRowsByBatchAndPool(storedData[testName]));
            setPooledRowData([]);
          } else {
            setTableRows(sortRowsByBatchAndPool(storedData[testName].rows || []));
            setPooledRowData(storedData[testName].pools || []);
          }
          setGetTheTestNames(Object.keys(storedData));
          setTestName(testName);
          return; // Do not fetch or overwrite with API data
        }

        // Otherwise, fetch from API
        const response = await axios.get(`/api/pool-data`, {
          params: {
            hospital_name: user.hospital_name,
            application: testName,
            internal_id: allInternalIds.join(','), // Join sample IDs into a comma-separated string
          },
        });
        if (response.data[0].status === 200) {
          const poolData = response.data[0].data;
          if (poolData && poolData.length > 0) {
            // Transform data into testName: [...] format
            const newData = poolData.reduce((acc, row) => {
              const tn = row.test_name;
              if (!acc[tn]) acc[tn] = [];
              acc[tn].push(row);
              return acc;
            }, {});

            // Only update localStorage if there was no local data for this testName
            if (!storedData[testName] || (Array.isArray(storedData[testName]) && storedData[testName].length === 0)) {
              const mergedData = { ...storedData, ...newData };
              setTableRows(newData[testName] || []);
              setPooledRowData([]);
              setGetTheTestNames(Object.keys(mergedData));
              setTestName(Object.keys(newData)[0]);
              localStorage.setItem('libraryPreparationData', JSON.stringify(mergedData));
            } else {
              if (Array.isArray(storedData[testName])) {
                setTableRows(sortRowsByBatchAndPool(storedData[testName]));
                setPooledRowData([]);
              } else {
                setTableRows(sortRowsByBatchAndPool(storedData[testName].rows || []));
                setPooledRowData(storedData[testName].pools || []);
              }
              setGetTheTestNames(Object.keys(storedData));
              setTestName(testName);
            }
          } else {
            setMessage(1);
          }
        }
      } catch (error) {
        console.error("Error fetching pool info:", error);
        toast.error("An error occurred while fetching pool info.");
      }
    };

    fetchPoolInfo();
  }, []);

  const plateOptions = [
    "NeoAmp-A", "NeoAmp-B", "NeoAmp-C", "NeoAmp-D",
    "1-NDI", "2-NDI", "3-NDI", "4-NDI",
    '5-NDI (WES)', '6-NDI (SGS)',
    "HLA-1", "HLA-2", "HLA-3", "HLA-4",
    "Myeloid-1", "Myeloid-2", "Myeloid-3", "Myeloid-4",
  ];

  // A01 - H12
  const wellNumberOptions = Array.from({ length: 96 }, (_, i) => {
    const row = String.fromCharCode(65 + (i % 8)); // Convert to A-H (cycle through rows)
    const col = Math.floor(i / 8 + 1).toString().padStart(2, '0'); // Convert to 01-12 (increment columns)
    return `${row}${col}`;
  });

  function handleCellKeyDown(e, { rowIndex, columnId, value, updateData, columns, tableRows, setSelectedCells, editableColumns }) {
    // console.log("KeyDown:", e.key, "rowIndex:", rowIndex, "columnId:", columnId);

    const visibleColumns = columns.map(col => col.accessorKey);
    const visibleEditableColumns = visibleColumns.filter(col => editableColumns.includes(col));
    const colIdx = visibleEditableColumns.indexOf(columnId);

    let nextRow = rowIndex;
    let nextColIdx = colIdx;

    if (e.key === "Tab") {
      updateData(rowIndex, columnId, value);
      if (e.shiftKey) {
        if (colIdx > 0) {
          nextColIdx = colIdx - 1;
          nextRow = rowIndex;
        } else if (rowIndex > 0) {
          nextRow = rowIndex - 1;
          nextColIdx = visibleEditableColumns.length - 1;
        } else {
          return;
        }
      } else {
        if (colIdx < visibleEditableColumns.length - 1) {
          nextColIdx = colIdx + 1;
          nextRow = rowIndex;
        } else if (rowIndex < tableRows.length - 1) {
          nextRow = rowIndex + 1;
          nextColIdx = 0;
        } else {
          return;
        }
      }
      setSelectedCells([{ rowIndex: nextRow, columnId: visibleEditableColumns[nextColIdx] }]);
      setTimeout(() => {
        const selector = `[data-row="${nextRow}"][data-column="${visibleEditableColumns[nextColIdx]}"]`;
        let nextElem = document.querySelector(`input${selector}`) ||
          document.querySelector(`select${selector}`);
        if (nextElem) nextElem.focus();
      }, 0);
      e.preventDefault();
      return;
    }

    // Handle Enter and Arrow keys
    if (e.key === "Enter" || e.key === "ArrowDown") {
      updateData(rowIndex, columnId, value);
      nextRow = rowIndex + 1;
    } else if (e.key === "ArrowUp") {
      updateData(rowIndex, columnId, value);
      nextRow = rowIndex - 1;
    } else if (e.key === "ArrowLeft") {
      updateData(rowIndex, columnId, value);
      nextColIdx = colIdx - 1;
    } else if (e.key === "ArrowRight") {
      updateData(rowIndex, columnId, value);
      nextColIdx = colIdx + 1;
    } else {
      return;
    }

    // Only move if within bounds
    if (
      nextRow >= 0 && nextRow < tableRows.length &&
      nextColIdx >= 0 && nextColIdx < visibleEditableColumns.length
    ) {
      setSelectedCells([{ rowIndex: nextRow, columnId: visibleEditableColumns[nextColIdx] }]);
      setTimeout(() => {
        const selector = `[data-row="${nextRow}"][data-column="${visibleEditableColumns[nextColIdx]}"]`;
        let nextElem = document.querySelector(`input${selector}`) ||
          document.querySelector(`select${selector}`);
        if (nextElem) nextElem.focus();
      }, 0);
      e.preventDefault();
    }
  }

  const columns = useMemo(() => {
    const cols = [];
    // Add checkbox column
    cols.push({
      accessorKey: "select",
      header: "",
      cell: ({ row }) => (
        <Checkbox
          checked={rowSelection[row.id] || false}
          onCheckedChange={(checked) => {
            const newSelection = { ...rowSelection, [row.id]: checked };
            if (!checked) delete newSelection[row.id];
            setRowSelection(newSelection);
          }}
        />
      ),
      enableSorting: false,
      enableHiding: true, // allow hiding via column selector
    });

    cols.push({
      accessorKey: "id",
      header: "S. No.",
      cell: ({ row }) => row.index + 1,
      enableSorting: true,
      enableHiding: false,
    }),

      // Add all other columns
      cols.push(
        ...allColumns
          .filter(col => col.key !== "select" && col.key !== "id")
          .map((column) => {
            let headerLabel = column.label;
            if (testName === "Myeloid") {
              if (column.key === 'total_vol_for_20nm') headerLabel = "Total Volume For 2nM";
              if (column.key === 'lib_vol_for_20nm') headerLabel = "Volume from Stock library for 2nM";
              if (column.key === 'nfw_volu_for_20nm') headerLabel = "NFW Volume For 2nM";
            }
            return {
              accessorKey: column.key,
              header: headerLabel,
              cell: (info) => {
                const value = typeof info.getValue === "function"
                  ? info.getValue()
                  : (info.row && info.row.original ? info.row.original[column.key] : "");
                if (column.key === 'registration_date') {
                  const formattedDate = new Date(value).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }); // Format as dd-mm-yyyy
                  return <span>{formattedDate}</span> || "";
                }

                if (column.key === 'well' || column.key === 'plate_designation') {
                  const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
                  const allAssignedPlateWellPairs = Object.values(storedData)
                    .flatMap(val => {
                      if (Array.isArray(val)) return val;
                      if (val && Array.isArray(val.rows)) return val.rows;
                      return [];
                    })
                    .map(row => ({
                      plate: row.plate_designation,
                      well: row.well
                    }))
                    .filter(pair => pair.plate && pair.well);

                  // Get the current row's plate
                  const currentRow = tableRows[info.row.index];
                  const currentPlate = currentRow?.plate_designation;

                  // Only disable wells that are already assigned with the same plate
                  const disabledWells = currentPlate
                    ? allAssignedPlateWellPairs
                      .filter(pair => pair.plate === currentPlate && pair.well !== currentRow?.well)
                      .map(pair => pair.well)
                    : [];
                  return (
                    <select
                      className="border-2 w-[100px] border-orange-300 rounded-lg p-2"
                      value={value || ""}
                      onChange={e => {
                        const newValue = e.target.value;
                        if (!newValue) return;
                        if (
                          column.key === 'well' &&
                          disabledWells.includes(newValue)
                        ) {
                          toast.error("This well number is already assigned for this plate.");
                          return;
                        }

                        setTableRows(prevRows => {
                          if (info.row.index === 0) {
                            if (syncFirstRow) {
                              // Sync logic (as before)
                              if (column.key === 'well') {
                                const startIdx = wellNumberOptions.indexOf(newValue);
                                return prevRows.map((row, idx) => {
                                  if (idx === 0 || (!manualWellRows.has(idx) && wellNumberOptions[startIdx + idx])) {
                                    return { ...row, well: wellNumberOptions[startIdx + idx] };
                                  }
                                  return row;
                                });
                              }
                              if (column.key === 'plate_designation') {
                                const oldPlate = prevRows[0].plate_designation;
                                return prevRows.map((row, idx) => {
                                  if (idx === 0 || (!manualPlateRows.has(idx) && row.plate_designation === oldPlate)) {
                                    return { ...row, plate_designation: newValue };
                                  }
                                  return row;
                                });
                              }
                            } else {
                              // Only update first row
                              return prevRows.map((row, idx) =>
                                idx === 0 ? { ...row, [column.key]: newValue } : row
                              );
                            }
                          } else {
                            if (column.key === 'well') {
                              setManualWellRows(prev => {
                                const next = new Set(prev);
                                // If matches expected sequence, unmark as manual
                                const firstWell = prevRows[0].well;
                                const startIdx = wellNumberOptions.indexOf(firstWell);
                                const expectedWell = wellNumberOptions[startIdx + info.row.index];
                                if (newValue === expectedWell) {
                                  next.delete(info.row.index);
                                } else {
                                  next.add(info.row.index);
                                }
                                return next;
                              });
                              return prevRows.map((row, idx) =>
                                idx === info.row.index ? { ...row, well: newValue } : row
                              );
                            }
                            if (column.key === 'plate_designation') {
                              setManualPlateRows(prev => {
                                const next = new Set(prev);
                                // If matches expected plate, unmark as manual
                                const firstPlate = prevRows[0].plate_designation;
                                if (newValue === firstPlate) {
                                  next.delete(info.row.index);
                                } else {
                                  next.add(info.row.index);
                                }
                                return next;
                              });
                              return prevRows.map((row, idx) =>
                                idx === info.row.index ? { ...row, plate_designation: newValue } : row
                              );
                            }
                          }
                        });
                      }}
                      onKeyDown={e =>
                        handleCellKeyDown(e, {
                          rowIndex: info.row.index,
                          columnId: column.key,
                          value,
                          updateData: table.options.meta.updateData,
                          columns,
                          tableRows,
                          setSelectedCells
                        })
                      }
                      data-row={info.row.index}
                      data-column={column.key}
                    >
                      <option value="">Select {column.key === 'well' ? 'Well' : 'Plate Designation'}</option>
                      {(column.key === 'well' ? wellNumberOptions : plateOptions).map(opt => (
                        <option
                          key={opt}
                          value={opt}
                          disabled={column.key === 'well' && disabledWells.includes(opt)}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  );
                }

                if (column.key === 'internal_id') {
                  // if row has the base_internal_id not null than show the base_internal_id value else internal_id value
                  const base_internal_id = info.row.original.base_internal_id;
                  return <span>{base_internal_id ? base_internal_id : value}</span> || "";
                }

                if (
                  column.key === "sample_id" ||
                  column.key === "test_name" ||
                  column.key === "patient_name" ||
                  column.key === "sample_type" ||
                  column.key === "pool_no" ||
                  column.key === "internal_id" ||
                  column.key === "batch_id" ||
                  column.key === "registration_date" ||
                  column.key === "client_id" ||
                  column.key === "client_name" ||
                  column.key === "docter_name" ||
                  column.key === "email" ||
                  column.key === "remarks" ||
                  column.key === "clinical_history" ||
                  column.key === "father_husband_name" ||
                  column.key === "age" ||
                  column.key === "gender"
                ) {
                  return <span>{value}</span> || "";
                }
                if (!info.row) return null;
                return (
                  <InputCell
                    value={value || ""}
                    rowIndex={info.row.index}
                    columnId={column.key}
                    columnLabel={column.label}
                    updateData={table.options.meta.updateData}
                    columns={columns}
                    tableRows={tableRows}
                    setSelectedCells={setSelectedCells}
                    editableColumns={editableColumns} // <-- pass this prop
                  />
                );
              },
              enableSorting: false,
              enableHiding: true,
            };
          })
      );


    return cols;
  }, [allColumns, rowSelection, testName]);

  useEffect(() => {
    const defaultVisible = getDefaultVisible(testName);

    // Start with allColumns
    const visibility = allColumns.reduce((acc, col) => {
      acc[col.key] = defaultVisible.includes(col.key);
      return acc;
    }, {});

    // Ensure "select" and "id" are included if present in defaultVisible
    ["select", "id"].forEach(key => {
      if (defaultVisible.includes(key)) {
        visibility[key] = true;
      } else {
        visibility[key] = false;
      }
    });

    setColumnVisibility(visibility);
  }, [testName]);

  const table = useReactTable({
    data: tableRows,
    columns,
    state: {
      sorting,
      columnVisibility, // Pass the updated columnVisibility state
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility, // Sync visibility changes
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setTableRows((prev) => {
          const updatedRows = prev.map((row, idx) => {
            if (idx !== rowIndex) return row; // Only update the specific row

            // Update the current field
            const updatedRow = { ...row, [columnId]: value };

            // Apply formulas dynamically
            const total_vol_for_20nm = parseFloat(updatedRow.total_vol_for_20nm) || 0;
            const lib_vol_for_20nm = parseFloat(updatedRow.lib_vol_for_20nm) || 0;
            const per_rxn_gdna = parseFloat(updatedRow.per_rxn_gdna) || 0;
            const volume = parseFloat(updatedRow.volume) || 0;
            const qubit_lib_qc_ng_ul = parseFloat(updatedRow.qubit_lib_qc_ng_ul) || 0;
            const one_tenth_of_nm_conc = parseFloat(updatedRow.one_tenth_of_nm_conc) || 0;
            const size = parseFloat(updatedRow.size) || 0;
            const nm_conc = parseFloat(updatedRow.nm_conc) || 0;
            const qubit_dna = parseFloat(updatedRow.qubit_dna) || 0;
            const conc_of_amplicons = parseFloat(updatedRow.conc_of_amplicons) || 0;

            if (columnId === "lib_qubit" || columnId === "size") {
              const lib_qubit = parseFloat(updatedRow.lib_qubit) || 0;
              const size = parseFloat(updatedRow.size) || 0;
              const nm_conc = lib_qubit > 0 ? (lib_qubit / (size * 660)) * 1000 : 0;

              updatedRow.nm_conc = parseFloat(nm_conc.toFixed(2));

              return updatedRow;
            }

            if (columnId === "total_vol_for_20nm") {
              updatedRow.lib_vol_for_20nm = parseFloat((2 * total_vol_for_20nm / nm_conc).toFixed(2));

              updatedRow.nfw_volu_for_20nm = parseFloat((total_vol_for_20nm - updatedRow.lib_vol_for_20nm).toFixed(2));
              return updatedRow;
            }

            if (columnId === "total_vol_for_20nm" || columnId === "vol_for_40nm_percent_pooling") {
              const totalVol = columnId === "total_vol_for_20nm"
                ? parseFloat(value) || 0
                : parseFloat(updatedRow.total_vol_for_20nm) || 0;
              const percent = columnId === "vol_for_40nm_percent_pooling"
                ? parseFloat(value) || 0
                : parseFloat(updatedRow.vol_for_40nm_percent_pooling) || 0;
              updatedRow.volume_from_40nm_for_total_25ul_pool = (totalVol * (percent / 100)).toFixed(2);

              // If you have other logic for total_vol_for_20nm, keep it here:
              if (columnId === "total_vol_for_20nm") {
                updatedRow.nfw_volu_for_20nm =
                  updatedRow.lib_vol_for_20nm && value
                    ? parseFloat((parseFloat(value) - parseFloat(updatedRow.lib_vol_for_20nm)).toFixed(2))
                    : "";
              }
              return updatedRow;
            }

            if (columnId === 'pool_conc' || columnId === 'size') {
              const poolConc = parseFloat(updatedRow.pool_conc) || 0;
              updatedRow.nm_conc = size > 0 ? Math.round(((poolConc / (size * 660)) * Math.pow(10, 6))) : "";
            }

            if (qubit_lib_qc_ng_ul) {
              updatedRow.lib_vol_for_hyb = parseFloat(200 / qubit_lib_qc_ng_ul).toFixed(2)
            }

            // if (columnId === "size") {
            //   updatedRow.one_tenth_of_nm_conc = nm_conc > 0 ? (parseFloat((nm_conc / 10).toFixed(2))) : "";
            // }

            if (qubit_dna || per_rxn_gdna) {
              updatedRow.gdna_volume_3x = qubit_dna > 0 ? Math.round((per_rxn_gdna / qubit_dna) * 3) : "";
            }

            if (testNameRef.current === "HLA" && qubit_dna) {
              updatedRow.dna_vol_for_dilution = qubit_dna > 0 ? (400 / qubit_dna).toFixed(2) : "";
              updatedRow.buffer_vol_to_be_added = (10 - updatedRow.dna_vol_for_dilution).toFixed(2);
            }

            if (columnId === "conc_of_amplicons") {
              updatedRow.vol_for_fragmentation = conc_of_amplicons > 0 ? (Math.round((250 / conc_of_amplicons) * 10) / 10).toFixed(1) : "";
            }

            if (columnId === "volume" || columnId === "gdna_volume_3x") {
              const gdna_volume_3x = parseFloat(updatedRow.gdna_volume_3x) || 0;
              updatedRow.nfw = volume > 0 ? volume - gdna_volume_3x : "";
            }

            if (columnId === "qubit_lib_qc_ng_ul") {
              // updatedRow.stock_ng_ul = qubit_lib_qc_ng_ul > 0 ? qubit_lib_qc_ng_ul * 10 : "";
              updatedRow.lib_vol_for_hyb = (200 / qubit_lib_qc_ng_ul).toFixed(2);

            }

            // if (columnId === "stock_ng_ul") {
            //   const stock = parseFloat(value) || 0;
            //   updatedRow.stock_ng_ul = stock;
            // }

            if (testNameRef.current === "SGS" && columnId === "qubit_lib_qc_ng_ul") {
              updatedRow.pooling_volume = qubit_lib_qc_ng_ul > 0 ? (100 / qubit_lib_qc_ng_ul).toFixed(2) : "";
            }

            if (columnId === "lib_qubit_for_2nm" || columnId === "size_for_2nm") {
              const libQubit2nm = parseFloat(updatedRow.lib_qubit_for_2nm) || 0;
              const size2nm = parseFloat(updatedRow.size_for_2nm) || 0
              updatedRow.nm_conc_for_2nm = libQubit2nm > 0 ? (libQubit2nm / (size2nm * 660)) * 1000000 : 0;
              updatedRow.nm_conc_for_2nm = parseFloat(updatedRow.nm_conc_for_2nm.toFixed(2));
            }

            // if (columnId === 'pool_conc' || columnId === 'size') {
            //   updatedRow.one_tenth_of_nm_conc = updatedRow.nm_conc > 0 ? (parseFloat((updatedRow.nm_conc / 10).toFixed(2))) : "";
            // }
            return updatedRow;

          })

          // Save to localStorage
          const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
          const currentTestName = testNameRef.current;
          if (currentTestName) {
            if (Array.isArray(storedData[currentTestName])) {
              // Upgrade old format to new
              storedData[currentTestName] = { rows: updatedRows, pools: pooledRowData };
            } else {
              storedData[currentTestName] = {
                rows: updatedRows,
                pools: pooledRowData,
              };
            }
            localStorage.setItem('libraryPreparationData', JSON.stringify(storedData));
          }
          return updatedRows;
        });
      },
    },
  });

  function getNextPoolNo() {
    const lastPoolNo = localStorage.getItem('lastPoolNo');
    let nextNumber = 1;
    if (lastPoolNo && /^P_\d+$/.test(lastPoolNo)) {
      nextNumber = parseInt(lastPoolNo.split('_')[1], 10) + 1;
    }
    const nextPoolNo = `P_${nextNumber.toString().padStart(3, '0')}`;
    localStorage.setItem('lastPoolNo', nextPoolNo);
    return nextPoolNo;
  }


  const handleCreatePool = async () => {
    if (Array.isArray(currentSelection) && currentSelection.length > 0) {
      const poolNo = getNextPoolNo();
      const firstIdx = currentSelection[0];
      const firstRow = tableRows[firstIdx] || {};
      const mergedPooledValues = {
        ...firstRow,
        ...pooledValues,
        pool_no: poolNo,
        total_vol_for_20nm: pooledValues.total_vol_for_20nm ?? firstRow.total_vol_for_20nm ?? "",
      };

      // 1. Assign pool_no to selected rows
      let updatedRows = tableRows.map((row, idx) =>
        currentSelection.includes(idx)
          ? { ...row, pool_no: poolNo }
          : row
      );

      // 2. Move all pooled rows above all unpooled rows, keeping their original order
      const pooledRows = updatedRows.filter(row => row.pool_no);
      const unpooledRows = updatedRows.filter(row => !row.pool_no);
      const newRows = [...pooledRows, ...unpooledRows];

      // 3. Pools track internal_ids, not indexes
      const newPool = {
        sampleInternalIds: currentSelection.map(idx => tableRows[idx].internal_id),
        values: mergedPooledValues
      };

      // 4. Recalculate all pools' sampleIndexes based on current newRows
      const updatedPooledRowData = [
        ...pooledRowData.map(pool => ({
          ...pool,
          sampleIndexes: (pool.sampleInternalIds || []).map(internal_id =>
            newRows.findIndex(r => r.internal_id === internal_id)
          ).filter(idx => idx !== -1)
        })),
        {
          ...newPool,
          sampleIndexes: newPool.sampleInternalIds.map(internal_id =>
            newRows.findIndex(r => r.internal_id === internal_id)
          ).filter(idx => idx !== -1)
        }
      ];

      // setTableRows(newRows);
      // setTableRows(sortRowsByBatchAndPool(newRows));
      // setPooledRowData(updatedPooledRowData);
      const sortedRows = sortRowsByBatchAndPool(newRows);
      const syncedPools = syncPoolSampleIndexes(updatedPooledRowData, sortedRows);
      setTableRows(sortedRows);
      setPooledRowData(syncedPools);
      setPooledValues({});
      setCurrentSelection([]);
      setShowPooledFields(false);
      setRowSelection({});
    }
  };

  function getNextBatchNo() {
    const lastBatchNo = localStorage.getItem('lastBatchNo');
    let nextNumber = 1;
    if (lastBatchNo && /^SBB_\d+$/.test(lastBatchNo)) {
      nextNumber = parseInt(lastBatchNo.split('_')[1], 10) + 1;
    }
    const nextBatchNo = `SBB_${nextNumber}`;
    localStorage.setItem('lastBatchNo', nextBatchNo);
    return nextBatchNo;
  }

  const handleCreateBatch = async () => {
    // Find all pools that have any selected row
    const selectedPoolIndexes = pooledRowData
      .filter(pool => pool.sampleIndexes.some(idx => currentSelection.includes(idx)))
      .map(pool => pool.sampleIndexes)
      .flat();

    // Combine all selected indexes (from pools and direct selection)
    const batchIndexes = Array.from(new Set([...currentSelection, ...selectedPoolIndexes]));

    if (batchIndexes.length > 0) {
      // Check if selection is consecutive
      const sorted = [...batchIndexes].sort((a, b) => a - b);
      // const isConsecutive = sorted.every((val, idx, arr) => idx === 0 || val === arr[idx - 1] + 1);
      // if (!isConsecutive) {
      //   toast.error("Please select consecutive rows to create a batch.");
      //   return;
      // }
      // Use local batch number logic
      const batchNo = getNextBatchNo();
      setTableRows(prevRows => {
        let updatedRows = prevRows.map((row, idx) =>
          sorted.includes(idx)
            ? { ...row, batch_id: batchNo }
            : row
        );
        // Update batch_id for all pools that have any selected row
        setPooledRowData(prevPools => {
          const updated = prevPools.map(pool => ({
            ...pool,
            batch_id: pool.sampleIndexes.some(idx => sorted.includes(idx)) ? batchNo : pool.batch_id
          }));
          return updated;
        });
        // Update localStorage
        const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
        if (storedData[testName]) {
          if (Array.isArray(storedData[testName])) {
            storedData[testName] = updatedRows;
          } else {
            storedData[testName].rows = updatedRows;
          }
          localStorage.setItem('libraryPreparationData', JSON.stringify(storedData));
        }
        return updatedRows; // <--- DO NOT SORT HERE
      });
      setCurrentSelection([]);
      setRowSelection({});
      setShowPooledFields(false);
    }
  };

  function calculateLibVolFor2nm(row, testName) {
    const total_vol_for_20nm = parseFloat(row.total_vol_for_20nm) || 0;
    const nm_conc = parseFloat(row.nm_conc) || 0;
    let lib_vol_for_20nm = "";
    let nfw_volu_for_20nm = "";

    if (nm_conc > 0 && total_vol_for_20nm > 0) {
      const multiplier = testName === "Myeloid" ? 2 : 20;
      lib_vol_for_20nm = parseFloat(((multiplier * total_vol_for_20nm) / nm_conc).toFixed(2));
      // if (lib_vol_for_20nm > total_vol_for_20nm) lib_vol_for_20nm = total_vol_for_20nm;
      nfw_volu_for_20nm = parseFloat((total_vol_for_20nm - lib_vol_for_20nm).toFixed(2));
    }
    return { lib_vol_for_20nm, nfw_volu_for_20nm };
  }

  useEffect(() => {
    setRowSelection({})
  }, [testName])

  const editableColumns = allColumns
    .map(col => col.key)
    .filter(key =>
      !["id", "select", "sample_id", "test_name", "patient_name", "sample_type", "pool_no", "internal_id"].includes(key)
    );

  useEffect(() => {
    // For each pool, update all rows in tableRows that belong to that pool
    setTableRows(prevRows => {
      // Ensure prevRows is always an array
      const safeRows = Array.isArray(prevRows) ? prevRows : [];
      let updatedRows = [...safeRows];
      pooledRowData.forEach(pool => {
        pool.sampleIndexes.forEach(idx => {
          updatedRows[idx] = {
            ...updatedRows[idx],
            ...pooledColumns.reduce((acc, col) => {
              acc[col] = pool.values[col] ?? "";
              return acc;
            }, {})
          };
        });
      });
      return updatedRows;
    });
  }, [pooledRowData]);

  const InputCell = ({ value: initialValue, rowIndex, columnId, updateData, columnLabel }) => {
    const [value, setValue] = useState(initialValue || "");
    const inputRef = useRef(null);

    const isSelected = selectedCells.some(
      cell => cell.rowIndex === rowIndex && cell.columnId === columnId
    );

    useEffect(() => {
      if (
        isSelected &&
        selectedCells.length === 1 &&
        inputRef.current
      ) {
        inputRef.current.focus();
      }
    }, [isSelected]);

    useEffect(() => {
      setValue(initialValue || "");
    }, [initialValue]);

    const handleChange = (e) => {
      setValue(e.target.value);
      // updateData(rowIndex, columnId, e.target.value);
    };

    const handleBlur = () => {
      updateData(rowIndex, columnId, value);
    };

    const handleMouseDown = (e) => {
      // Only prevent default if starting a selection (e.g., shift/ctrl or double click)
      const isAlreadySelected =
        selectedCells.length === 1 &&
        selectedCells[0].rowIndex === rowIndex &&
        selectedCells[0].columnId === columnId;

      // If clicking the same cell (single click, no modifiers), deselect
      if (
        isAlreadySelected &&
        !(e.shiftKey || e.ctrlKey || e.metaKey || e.detail > 1)
      ) {
        setSelectedCells([]);
        setIsSelecting(false);
        setSelectionStart(null);
        // Allow input/select to be focused
        return;
      }

      // If clicking a different cell (single click, no modifiers), select it
      if (
        !(e.shiftKey || e.ctrlKey || e.metaKey || e.detail > 1)
      ) {
        setSelectedCells([{ rowIndex, columnId }]);
        setIsSelecting(false);
        setSelectionStart(null);
        // Allow input/select to be focused
        return;
      }

      // If modifier keys or double click, start selection and prevent default
      if (e.detail > 1 || e.shiftKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setIsSelecting(true);
        setSelectionStart({ rowIndex, columnId });
        setSelectedCells([{ rowIndex, columnId }]);
        return;
      }
      // For single click, allow default (focus input for typing)
    };

    // const handleKeyDown = (e) => {
    //   const visibleColumns = columns.map(col => col.accessorKey);
    //   const colIdx = visibleColumns.indexOf(columnId);

    //   let nextRow = rowIndex;
    //   let nextColIdx = colIdx;

    //   if (e.key === "Enter" || e.key === "ArrowDown") {
    //     updateData(rowIndex, columnId, value);
    //     nextRow = rowIndex + 1;
    //   } else if (e.key === "ArrowUp") {
    //     updateData(rowIndex, columnId, value);
    //     nextRow = rowIndex - 1;
    //   } else if (e.key === "Tab") {
    //     updateData(rowIndex, columnId, value);
    //     if (e.shiftKey) {
    //       nextColIdx = colIdx - 1;
    //     } else {
    //       nextColIdx = colIdx + 1;
    //     }
    //     // Only move if within bounds
    //     if (nextColIdx >= 0 && nextColIdx < visibleColumns.length) {
    //       setSelectedCells([{ rowIndex, columnId: visibleColumns[nextColIdx] }]);
    //       setTimeout(() => {
    //         const selector = `[data-row="${rowIndex}"][data-column="${visibleColumns[nextColIdx]}"]`;
    //         let nextElem = document.querySelector(`input${selector}`) ||
    //           document.querySelector(`select${selector}`);
    //         if (nextElem) nextElem.focus();
    //       }, 0);
    //       e.preventDefault();
    //     }
    //     return;
    //   }
    //   else if (e.key === "ArrowLeft") {
    //     updateData(rowIndex, columnId, value);
    //     nextColIdx = colIdx - 1;
    //   } else if (e.key === "ArrowRight") {
    //     updateData(rowIndex, columnId, value);
    //     nextColIdx = colIdx + 1;
    //   } else {
    //     return;
    //   }

    //   // Only move if within bounds
    //   if (nextRow >= 0 && nextRow < tableRows.length && nextColIdx >= 0 && nextColIdx < visibleColumns.length) {
    //     setSelectedCells([{ rowIndex: nextRow, columnId: visibleColumns[nextColIdx] }]);
    //     setTimeout(() => {
    //       // Try to focus input first, then select if input not found
    //       const selector = `[data-row="${nextRow}"][data-column="${visibleColumns[nextColIdx]}"]`;
    //       let nextElem = document.querySelector(`input${selector}`) ||
    //         document.querySelector(`select${selector}`);
    //       if (nextElem) nextElem.focus();
    //     }, 0);
    //     e.preventDefault();
    //   }
    // };

    const handleMouseEnter = (e) => {
      e.preventDefault(); // Prevent default to avoid text selection
      if (isSelecting && selectionStart) {
        const cells = [];
        const minRow = Math.min(selectionStart.rowIndex, rowIndex);
        const maxRow = Math.max(selectionStart.rowIndex, rowIndex);
        const visibleColumns = columns.map(col => col.accessorKey);
        const startColIdx = visibleColumns.indexOf(selectionStart.columnId);
        const endColIdx = visibleColumns.indexOf(columnId);
        const minCol = Math.min(startColIdx, endColIdx);
        const maxCol = Math.max(startColIdx, endColIdx);

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const colKey = visibleColumns[c];
            if (editableColumns.includes(colKey)) {
              cells.push({ rowIndex: r, columnId: colKey });
            }
          }
        }
        setSelectedCells(cells);
      }
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
      setSelectionStart(null);
    };

    return (
      <Input
        ref={inputRef}
        data-row={rowIndex}
        data-column={columnId}
        className={`border border-orange-300 rounded p-1 text-xs w-[100px] text-center ${isSelected ? "ring-2 ring-orange-500 bg-orange-50" : ""}`}
        value={value}
        type="text"
        placeholder={`${columnLabel}...`}
        onChange={handleChange}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onKeyDown={e =>
          handleCellKeyDown(e, {
            rowIndex,
            columnId,
            value,
            updateData,
            columns,
            tableRows,
            setSelectedCells,
            editableColumns // <-- pass here
          })
        }
      />
    );
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Only trigger if a cell is selected and not already focused
      if (
        selectedCells.length === 1 &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "SELECT" &&
        e.key.length === 1 // Only for character keys
      ) {
        setTimeout(() => {
          const { rowIndex, columnId } = selectedCells[0];
          const selector = `[data-row="${rowIndex}"][data-column="${columnId}"]`;
          const input = document.querySelector(`input${selector}`);
          if (input) {
            input.focus();
            input.value = ""; // Clear for new typing
          }
        }, 0);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedCells]);

  useEffect(() => {
    async function syncLastPoolNo() {
      const response = await axios.get(`/api/pool-no?id=pool_no&count=1&hospital_name=${user.hospital_name}`);
      if (response.data[0]?.pool_no) {
        // console.log('response.data[0]', response.data[0]);
        localStorage.setItem('lastPoolNo', response.data[0].pool_no);
      }
    }
    syncLastPoolNo();
  }, []);

  useEffect(() => {
    async function syncLastBatchNo() {
      const response = await axios.get(`/api/pool-no?id=batch_id&count=1&hospital_name=${user.hospital_name}`);
      if (response.data[0]?.batch_id) {
        localStorage.setItem('lastBatchNo', response.data[0].batch_id);
      }
    }
    syncLastBatchNo();
  }, []);


  useEffect(() => {
    const handlePaste = (e) => {
      if (!selectedCells.length) return;

      const clipboard = e.clipboardData.getData("text/plain");
      if (!clipboard) return;

      // Parse clipboard into a 2D array
      const clipboardRows = clipboard.split(/\r?\n/).filter(Boolean).map(row => row.split('\t'));
      if (clipboardRows.length === 0) return;

      // Get visible columns in order (including non-editable)
      const visibleColumns = columns
        .filter(col => table.getState().columnVisibility[col.accessorKey])
        .map(col => col.accessorKey);

      // Find selection bounds
      // Use selection start point as origin
      const origin = selectionStart || selectedCells[0]; // fallback
      const startRow = origin.rowIndex;
      const startCol = visibleColumns.indexOf(origin.columnId);

      setTableRows(prevRows => {
        let updatedRows = [...prevRows];
        for (let r = 0; r < clipboardRows.length; r++) {
          for (let c = 0; c < clipboardRows[r].length; c++) {
            const rowIndex = startRow + r;
            const colIndex = startCol + c;
            const columnId = visibleColumns[colIndex];

            if (
              rowIndex < updatedRows.length &&
              editableColumns.includes(columnId)
            ) {
              const pastedValue = clipboardRows[r][c];

              let updatedRow = { ...updatedRows[rowIndex], [columnId]: pastedValue };

              // --- Apply your formulas here (copy from updateData) ---
              // Example (add all your formula logic here):
              const total_vol_for_20nm = parseFloat(updatedRow.total_vol_for_20nm) || 0;
              // const lib_vol_for_20nm = parseFloat(updatedRow.lib_vol_for_20nm) || 0;
              const per_rxn_gdna = parseFloat(updatedRow.per_rxn_gdna) || 0;
              const volume = parseFloat(updatedRow.volume) || 0;
              const qubit_lib_qc_ng_ul = parseFloat(updatedRow.qubit_lib_qc_ng_ul) || 0;
              const one_tenth_of_nm_conc = parseFloat(updatedRow.one_tenth_of_nm_conc) || 0;
              const size = parseFloat(updatedRow.size) || 0;
              const nm_conc = parseFloat(updatedRow.nm_conc) || 0;
              const qubit_dna = parseFloat(updatedRow.qubit_dna) || 0;

              if (columnId === "lib_qubit") {
                const lib_qubit = parseFloat(updatedRow.lib_qubit) || 0;
                const size = parseFloat(updatedRow.size) || 0;
                const nm_conc = lib_qubit > 0 ? (lib_qubit / (size * 660)) * 1000 : 0;

                updatedRow.nm_conc = parseFloat(nm_conc.toFixed(2));

                const total_vol_for_20nm = parseFloat(updatedRow.total_vol_for_20nm) || 0;

                if (nm_conc > 0 && total_vol_for_20nm > 0) {
                  updatedRow.lib_vol_for_20nm = parseFloat(((20 * total_vol_for_20nm) / nm_conc).toFixed(2));
                  if (updatedRow.lib_vol_for_20nm > total_vol_for_20nm) {
                    updatedRow.lib_vol_for_20nm = total_vol_for_20nm;
                  }
                  updatedRow.nfw_volu_for_20nm = parseFloat((total_vol_for_20nm - updatedRow.lib_vol_for_20nm).toFixed(2));
                } else {
                  updatedRow.lib_vol_for_20nm = 0;
                  updatedRow.nfw_volu_for_20nm = total_vol_for_20nm;
                }
              }

              if (testName === "HLA" && qubit_dna) {
                updatedRow.dna_vol_for_dilution = qubit_dna > 0 ? (400 / qubit_dna).toFixed(2) : "";
                updatedRow.buffer_vol_to_be_added = (10 - updatedRow.dna_vol_for_dilution).toFixed(2);
              }

              if (columnId === "conc_of_amplicons") {
                updatedRow.vol_for_fragmentation = updatedRow.conc_of_amplicons > 0 ? (Math.round((250 / updatedRow.conc_of_amplicons) * 10) / 10).toFixed(1) : "";
              }

              if (columnId === "nm_conc" || columnId === "total_vol_for_20nm") {
                if (nm_conc > 0 && total_vol_for_20nm > 0) {
                  updatedRow.lib_vol_for_20nm = parseFloat(((20 * total_vol_for_20nm) / nm_conc).toFixed(2));

                  updatedRow.nfw_volu_for_20nm = parseFloat((total_vol_for_20nm - updatedRow.lib_vol_for_20nm).toFixed(2));
                } else {
                  updatedRow.lib_vol_for_20nm = "";
                  updatedRow.nfw_volu_for_20nm = "";
                }
              }

              if (columnId === "total_vol_for_20nm") {
                updatedRow.nfw_volu_for_20nm =
                  updatedRow.lib_vol_for_20nm && value
                    ? parseFloat((parseFloat(value) - parseFloat(updatedRow.lib_vol_for_20nm)).toFixed(2))
                    : "";
                return updatedRow;
              }

              if (columnId === 'pool_conc' || columnId === 'size') {
                const poolConc = parseFloat(updatedRow.pool_conc) || 0;
                updatedRow.nm_conc = size > 0 ? Math.round(((poolConc / (size * 660)) * Math.pow(10, 6))) : "";
              }

              if (qubit_lib_qc_ng_ul) {
                updatedRow.lib_vol_for_hyb = parseFloat(200 / qubit_lib_qc_ng_ul).toFixed(2)
              }

              // if (columnId === "size") {
              //   updatedRow.one_tenth_of_nm_conc = nm_conc > 0 ? (parseFloat((nm_conc / 10).toFixed(2))) : "";
              // }

              if (qubit_dna || per_rxn_gdna) {
                updatedRow.gdna_volume_3x = qubit_dna > 0 ? Math.round((per_rxn_gdna / qubit_dna) * 3) : "";
              }

              if (columnId === "volume" || columnId === "gdna_volume_3x") {
                const gdna_volume_3x = parseFloat(updatedRow.gdna_volume_3x) || 0;
                updatedRow.nfw = volume > 0 ? volume - gdna_volume_3x : "";
              }

              if (columnId === "qubit_lib_qc_ng_ul") {
                // updatedRow.stock_ng_ul = qubit_lib_qc_ng_ul > 0 ? qubit_lib_qc_ng_ul * 10 : "";
                updatedRow.lib_vol_for_hyb = (200 / qubit_lib_qc_ng_ul).toFixed(2);
              }
              // if (columnId === "stock_ng_ul") {
              //   const stock = parseFloat(rows[r][c]) || 0;
              //   updatedRow.stock_ng_ul = stock;
              // }

              if (testName === "SGS" && columnId === "qubit_lib_qc_ng_ul") {
                updatedRow.pooling_volume = qubit_lib_qc_ng_ul > 0 ? (100 / qubit_lib_qc_ng_ul).toFixed(2) : "";
              }

              // if (columnId === 'pool_conc' || columnId === 'size') {
              //   updatedRow.one_tenth_of_nm_conc = updatedRow.nm_conc > 0 ? (parseFloat((updatedRow.nm_conc / 10).toFixed(2))) : "";
              // }

              const { lib_vol_for_20nm, nfw_volu_for_20nm } = calculateLibVolFor2nm(updatedRow, testName);
              updatedRow.lib_vol_for_20nm = lib_vol_for_20nm;
              updatedRow.nfw_volu_for_20nm = nfw_volu_for_20nm;

              updatedRows[rowIndex] = updatedRow;
            }
          }
        }
        return updatedRows;
      });
      e.preventDefault();
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectedCells, editableColumns, columns, table]);

  useEffect(() => {
    const handleCopy = (e) => {
      if (!selectedCells.length) return;

      // Sort cells by rowIndex, then columnId
      const sortedCells = [...selectedCells].sort((a, b) => {
        if (a.rowIndex === b.rowIndex) {
          return a.columnId.localeCompare(b.columnId);
        }
        return a.rowIndex - b.rowIndex;
      });

      // Group cells by rowIndex
      const grouped = sortedCells.reduce((acc, cell) => {
        if (!acc[cell.rowIndex]) acc[cell.rowIndex] = [];
        acc[cell.rowIndex].push(cell);
        return acc;
      }, {});

      // Build clipboard string
      const lines = Object.keys(grouped)
        .sort((a, b) => a - b)
        .map(rowIdx =>
          grouped[rowIdx]
            .sort((a, b) => a.columnId.localeCompare(b.columnId))
            .map(cell => tableRows[cell.rowIndex][cell.columnId] ?? "")
            .join('\t')
        );

      const clipboardString = lines.join('\n');
      e.clipboardData.setData('text/plain', clipboardString);
      e.preventDefault();
    };

    window.addEventListener("copy", handleCopy);
    return () => window.removeEventListener("copy", handleCopy);
  }, [selectedCells, tableRows]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if Delete or Backspace is pressed and cells are selected
      if (
        selectedCells.length > 0 &&
        (e.key === "Delete" || e.key === "Backspace") &&
        // Don't trigger if an input is focused (let the input handle it)
        document.activeElement.tagName !== "INPUT"
      ) {
        setTableRows(prevRows =>
          prevRows.map((row, rowIndex) => {
            const updatedRow = { ...row };
            selectedCells.forEach(cell => {
              if (cell.rowIndex === rowIndex) {
                updatedRow[cell.columnId] = "";
              }
            });
            return updatedRow;
          })
        );
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCells]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('libraryPreparationData'));
    if (storedData) {
      const testNames = Object.keys(storedData); // Extract keys from the stored data
      setGetTheTestNames(testNames); // Update state with test names

      if (testNames.length > 0) {
        const defaultTestName = testNames[0];
        setTestName(defaultTestName);
        if (Array.isArray(storedData[defaultTestName])) {
          setTableRows(sortRowsByBatchAndPool(storedData[defaultTestName]));
          setPooledRowData([]);
        } else {
          setTableRows(sortRowsByBatchAndPool(storedData[defaultTestName]).rows || []);
          setPooledRowData(storedData[defaultTestName].pools || []);
        }
      }
    }
  }, []);

  const handleTestNameSelection = async (selectedTestName) => {
    setTestName(selectedTestName);
    setSelectedSampleIndicator(selectedTestName);
    const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};

    // Always show local data if it exists
    if (storedData && storedData[selectedTestName]) {
      if (Array.isArray(storedData[selectedTestName])) {
        setTableRows(sortRowsByBatchAndPool(storedData[selectedTestName]));
        setPooledRowData([]);
      } else {
        setTableRows(sortRowsByBatchAndPool(storedData[selectedTestName].rows || []));
        setPooledRowData(storedData[selectedTestName].pools || []);
      }
      return; // Do not fetch or overwrite with API data
    }

    // If no local data, fetch from API
    try {
      const allInternalIds = Object.values(storedData)
        .flatMap(arr => arr.map(row => row.internal_id))
        .filter(Boolean);
      const response = await axios.get(`/api/pool-data`, {
        params: {
          hospital_name: user.hospital_name,
          application: selectedTestName,
          internal_id: allInternalIds.join(','),
        },
      });
      if (response.data[0].status === 200) {
        const poolData = response.data[0].data;
        if (poolData && poolData.length > 0) {
          const newData = poolData.reduce((acc, row) => {
            const testName = row.test_name;
            if (!acc[testName]) acc[testName] = [];
            acc[testName].push(row);
            return acc;
          }, {});
          setTableRows(newData[selectedTestName] || []);
          // Only update localStorage if there was no local data
          if (!storedData[selectedTestName] || storedData[selectedTestName].length === 0) {
            const mergedData = { ...storedData, ...newData };
            localStorage.setItem('libraryPreparationData', JSON.stringify(mergedData));
          }
        } else {
          setTableRows([]);
          setMessage(1);
        }
      }
    } catch (error) {
      console.error("Error in handleTestNameSelection:", error);
      toast.error("An error occurred while selecting the test name.");
    }
  };

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('libraryPreparationData'));
    if (storedData) {
      const testNames = Object.keys(storedData); // Extract keys from the stored data
      setGetTheTestNames(testNames); // Update state with test names

      // Set default testName and tableRows based on the first key
      if (testNames.length > 0) {
        const defaultTestName = testNames[0];
        setTestName(defaultTestName);
        setTableRows(storedData[defaultTestName]);
      }
    }
  }, []);

  const handleSaveAll = async () => {
    setProcessing(true);
    try {
      const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
      const hospital_name = user.hospital_name;

      // Prepare an array of promises for all testNames
      const savePromises = Object.entries(storedData).map(([testName, data]) => {
        let rows = [];
        if (Array.isArray(data)) {
          rows = data;
        } else if (data && Array.isArray(data.rows)) {
          // Sync pools for each testName
          rows = data.rows.map((row, idx) => {
            const pool = (data.pools || []).find(pool => pool.sampleIndexes.includes(idx));
            if (pool) {
              return { ...row, ...pool.values };
            }
            return row;
          });
        }
        return axios.post('/api/pool-data', {
          hospital_name,
          testName,
          rows,
        });
      });

      const results = await Promise.all(savePromises);

      // Check if all were successful
      const allSuccess = results.every(res => res.data[0]?.status === 200);

      if (allSuccess) {
        toast.success("All data saved successfully!");
        setProcessing(false);
        // localStorage.removeItem('libraryPreparationData');
        // setMessage(1); // Set message to indicate no data available
        // setTableRows([]);
        // setGetTheTestNames([]);
      } else {
        setProcessing(false);
        toast.error("Some data could not be saved. Please check and try again.");
      }
    } catch (error) {
      console.error("Error saving all data:", error);
      toast.error("An error occurred while saving all data.");
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
      // const poolNos = [...new Set(tableRows.map(row => row.pool_no).filter(Boolean))];

      // Prepare the payload for the API call
      const syncedRows = tableRows.map((row, idx) => {
        const pool = pooledRowData.find(pool => pool.sampleIndexes.includes(idx));
        if (pool) {
          // Merge both pooledColumns and finalPoolingColumns
          const pooledFields = [...pooledColumns, ...finalPoolingColumns].reduce((acc, key) => {
            acc[key] = pool.values[key];
            return acc;
          }, {});
          return {
            ...row,
            ...pooledFields,
            id: idx + 1,
          };
        }
        return { ...row, id: idx + 1 };
      });
      const payload = {
        hospital_name: user.hospital_name,
        testName: testName,
        rows: syncedRows,
      };

      // console.log('payload:', payload);

      const response = await axios.post('/api/pool-data', payload);

      if (response.data[0].status === 200) {
        toast.success("Data Saved successfully!");
        setProcessing(false);
        // Remove only the selected testName's data
        const updatedData = { ...storedData };
        // delete updatedData[testName];

        localStorage.setItem('libraryPreparationData', JSON.stringify(updatedData));
        // setTableRows([]); 
        // setMessage(1); // Set message to indicate no data available
      } else if (response.data[0].status === 400) {
        toast.error(response.data[0].message);
        setProcessing(false);
      }
    } catch (error) {
      // console.log("Error updating values:", error);
      setProcessing(false);
      toast.error("An error occurred while updating the values.");
    }
  };

  function safeParse(json, fallback = {}) {
    try {
      if (!json) return fallback;
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  const selectedRows = table.getRowModel().rows.filter(r => rowSelection[r.id]);
  const lastSelectedIndex = selectedRows.length > 0
    ? selectedRows[selectedRows.length - 1].index
    : null;
  const currentSelectedIndexes = selectedRows.map(r => r.index);

  useEffect(() => {
    setCurrentSelection(currentSelectedIndexes);
  }, [rowSelection]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
    if (storedData[testName]) {
      let rows, pools;
      if (Array.isArray(storedData[testName])) {
        rows = sortRowsByBatchAndPool(storedData[testName]);
        pools = [];
      } else {
        rows = sortRowsByBatchAndPool(storedData[testName].rows || []);
        pools = storedData[testName].pools || [];
      }
      // Sync pool sampleIndexes with the loaded/sorted rows
      const syncedPools = syncPoolSampleIndexes(pools, rows);
      setTableRows(rows);
      setPooledRowData(syncedPools);
    }
  }, [testName]);

  useEffect(() => {
    // Save pooledColumns for each pool in localStorage under the current testName
    if (!testName) return;
    const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
    // Save both tableRows and pooledRowData under the same testName key
    storedData[testName] = {
      rows: tableRows,
      pools: pooledRowData,
    };
    localStorage.setItem('libraryPreparationData', JSON.stringify(storedData));
  }, [pooledRowData, tableRows, testName]);


  useEffect(() => {
    if (!pooledRowData.length || !tableRows.length) return;

    let needsUpdate = false;
    const poolsByBatch = {};

    // Group pools by batch_id
    pooledRowData.forEach((pool, poolIdx) => {
      const firstIdx = pool.sampleIndexes[0];
      const batchId = tableRows[firstIdx]?.batch_id;
      if (!batchId) return;
      if (!poolsByBatch[batchId]) poolsByBatch[batchId] = [];
      poolsByBatch[batchId].push({ pool, poolIdx });
    });

    let newPooledRowData = [...pooledRowData];

    Object.values(poolsByBatch).forEach(poolsInBatch => {
      // 1. Calculate percent for each pool (unrounded)
      const batchRows = tableRows.filter(row => row.batch_id === tableRows[poolsInBatch[0].pool.sampleIndexes[0]]?.batch_id);
      const batchSum = batchRows.reduce(
        (sum, row) => sum + (parseFloat(row.data_required) || 0),
        0
      );

      // Calculate unrounded percents for each pool
      const unroundedPercents = poolsInBatch.map(({ pool }) => {
        const poolSum = pool.sampleIndexes.reduce(
          (sum, idx) => sum + (parseFloat(tableRows[idx]?.data_required) || 0),
          0
        );
        return batchSum > 0 ? (poolSum / batchSum) * 100 : 0;
      });

      // Round all but last, last = 100 - sum of previous
      let roundedPercents = [];
      let sumRounded = 0;
      for (let i = 0; i < unroundedPercents.length; i++) {
        if (i < unroundedPercents.length - 1) {
          const rounded = Number(unroundedPercents[i].toFixed(2));
          roundedPercents.push(rounded);
          sumRounded += rounded;
        } else {
          const last = Number((100 - sumRounded).toFixed(2));
          roundedPercents.push(last);
        }
      }
      // console.log('roundedPercents:', roundedPercents);
      // 2. Calculate initial (unscaled) volume for each pool using rounded percents
      const unscaled = poolsInBatch.map(({ pool, poolIdx }, i) => {
        const totalVol = parseFloat(pool.values.total_vol_for_20nm) || 0;
        const percent = roundedPercents[i];
        const vol = (totalVol * (percent / 100)) || 0;

        // console.log('percent:', percent, 'totalVol:', totalVol, 'vol:', vol);

        // Update percent if needed
        const percentStr = percent.toFixed(2);
        if (pool.values.vol_for_40nm_percent_pooling !== percentStr) {
          needsUpdate = true;
          newPooledRowData[poolIdx] = {
            ...pool,
            values: {
              ...pool.values,
              vol_for_40nm_percent_pooling: percentStr,
            }
          };
        }
        return vol;
      });

      // 3. Scale so sum is 25
      const sumUnscaled = unscaled.reduce((a, b) => a + b, 0) || 1;
      let scaledVolumes = [];
      let sumScaled = 0;
      for (let i = 0; i < poolsInBatch.length; i++) {
        if (i < poolsInBatch.length - 1) {
          const scaled = Number(((unscaled[i] / sumUnscaled) * 25).toFixed(2));
          scaledVolumes.push(scaled);
          sumScaled += scaled;
        } else {
          // Last pool: set to 25 - sum of previous
          const lastScaled = Number((25 - sumScaled).toFixed(2));
          scaledVolumes.push(lastScaled);
        }
      }
      poolsInBatch.forEach(({ pool, poolIdx }, i) => {
        if (pool.values.volume_from_40nm_for_total_25ul_pool !== scaledVolumes[i].toString()) {
          needsUpdate = true;
          newPooledRowData[poolIdx] = {
            ...newPooledRowData[poolIdx],
            values: {
              ...newPooledRowData[poolIdx].values,
              volume_from_40nm_for_total_25ul_pool: scaledVolumes[i].toString(),
            }
          };
        }
      });
    });

    if (needsUpdate && !isEqual(newPooledRowData, pooledRowData)) {
      setPooledRowData(newPooledRowData);
    }
    // eslint-disable-next-line
  }, [tableRows, pooledRowData]);


  const filteredTestNames = getTheTestNames.filter(testName => {
    const storedData = safeParse(localStorage.getItem("libraryPreparationData"), {});
    const testData = storedData[testName];
    if (!testData) return false;
    if (Array.isArray(testData)) {
      return testData.length > 0;
    }
    return (Array.isArray(testData.rows) && testData.rows.length > 0) ||
      (Array.isArray(testData.pools) && testData.pools.length > 0);
  });

  useEffect(() => {
    if (!tableRows.length) return;

    function generateHex(str, salt = "") {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(6, "0").slice(0, 6).toUpperCase();
    }

    const visibleIndexes = ["i5_index_forward", "i5_index_reverse", "i7_index"].filter(
      key => columnVisibility[key]
    );
    if (visibleIndexes.length === 0) return;

    let needsUpdate = false;
    const newRows = tableRows.map((row, idx) => {
      let updatedRow = { ...row };
      visibleIndexes.forEach((key) => {
        if (row.barcode) {
          // Generate index based on barcode
          const newHex = generateHex(row.barcode + "-" + key);
          if (updatedRow[key] !== newHex) {
            updatedRow[key] = newHex;
            needsUpdate = true;
          }
        } else if (row.well && row.plate_designation) {
          // Generate index based on well and plate
          const newHex = generateHex(row.plate_designation + "-" + row.well + "-" + key);
          if (updatedRow[key] !== newHex) {
            updatedRow[key] = newHex;
            needsUpdate = true;
          }
        } else {
          // Clear value if neither is present
          if (updatedRow[key]) {
            updatedRow[key] = "";
            needsUpdate = true;
          }
        }
      });
      return updatedRow;
    });

    if (needsUpdate) setTableRows(newRows);
  }, [columnVisibility, tableRows]);

  const sortSamplesByType = (rows) => {
    // I want to check the test_name before sorting only sort if test_name is myeloid
    if (testName === "Myeloid") {
      return rows.sort((a, b) => {
        if (a.sample_type === b.sample_type) return 0;
        if (a.sample_type === "RNA") return -1;
        if (b.sample_type === "RNA") return 1;
        return 0; // Keep original order for other types
      });
    }
    return rows; // No sorting for other test names
  }

  useEffect(() => {
    setTableRows(prevRows => sortSamplesByType(prevRows));
  }, [testName, tableRows]);


  function sortRowsByBatchAndPool(rows) {
    if (!Array.isArray(rows)) return []
    return [...rows].sort((a, b) => {
      // Sort by batch_id, then pool_no, then id (or index)
      if ((a.batch_id || "") < (b.batch_id || "")) return -1;
      if ((a.batch_id || "") > (b.batch_id || "")) return 1;
      if ((a.pool_no || "") < (b.pool_no || "")) return -1;
      if ((a.pool_no || "") > (b.pool_no || "")) return 1;
      return (a.id || 0) - (b.id || 0);
    });
  }

  function syncPoolSampleIndexes(pools, rows) {
    return pools.map(pool => ({
      ...pool,
      sampleIndexes: (pool.sampleInternalIds || []).map(internal_id =>
        rows.findIndex(r => r.internal_id === internal_id)
      ).filter(idx => idx !== -1)
    }));
  }

  const handleAddSampleToPool = (rowIndex, poolNo) => {
    if (!poolNo) return;
    setTableRows(prevRows => {
      const pool = pooledRowData.find(p => p.values.pool_no === poolNo);
      const poolBatchId = pool?.batch_id || "";
      const internal_id = prevRows[rowIndex].internal_id;

      // Remove from other pools, add to target pool
      let newPools = pooledRowData.map(p => {
        let sampleInternalIds = p.sampleInternalIds.filter(id => id !== internal_id);
        if (p.values.pool_no === poolNo && !sampleInternalIds.includes(internal_id)) {
          sampleInternalIds = [...sampleInternalIds, internal_id];
        }
        return { ...p, sampleInternalIds };
      }).filter(p => p.sampleInternalIds.length > 0);

      let updatedRows = prevRows.map((row, idx) =>
        idx === rowIndex
          ? { ...row, pool_no: poolNo, batch_id: poolBatchId || row.batch_id }
          : row
      );

      let sortedRows = sortRowsByBatchAndPool(updatedRows);
      newPools = syncPoolSampleIndexes(newPools, sortedRows);

      // For all samples in the pool, update their pooled columns from pool.values
      sortedRows = sortedRows.map(row => {
        const poolForRow = newPools.find(p => p.sampleInternalIds.includes(row.internal_id));
        if (poolForRow && poolForRow.values) {
          const pooledFields = pooledColumns.reduce((acc, key) => {
            acc[key] = poolForRow.values[key];
            return acc;
          }, {});
          // Always set batch_id from pool if present
          return { ...row, ...pooledFields, batch_id: poolForRow.batch_id || row.batch_id };
        }
        return row;
      });

      setPooledRowData(newPools);
      return sortedRows;
    });
  };

  const myeloidTotal = testName === "Myeloid"
    ? (Array.isArray(tableRows) ? tableRows : []).reduce((sum, row) => sum + (parseFloat(row.data_required) || 0), 0)
    : 0;

  const visibleColumns = columns.filter(
    col => table.getState().columnVisibility[col.accessorKey] !== false
  );
  const dataRequiredVisibleIdx = visibleColumns.findIndex(
    col => col.accessorKey === "data_required"
  );
  return (
    <div className="p-4 ">
      {!message ?
        (<>

          <div className="mb-4 flex items-center gap-4 overflow-x-auto ">
            <Tabs value={testName} className="w-full rounded-lg ">
              <TabsList className="flex flex-nowrap bg-white dark:bg-gray-800 ">
                {filteredTestNames.map((testName, index) => (
                  <TabsTrigger
                    key={index}
                    value={testName}
                    onClick={() => handleTestNameSelection(testName)}
                    className={`text-sm px-4 py-2 cursor-pointer font-bold rounded-lg data-[state=active]:bg-orange-400 data-[state=active]:text-white
                      }`}
                  >
                    {testName}
                  </TabsTrigger>
                ))}

              </TabsList>
            </Tabs>
          </div>

          {selectedCells.length > 1 && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow z-50">
              <input
                type="text"
                placeholder="Bulk value"
                value={bulkValue}
                onChange={e => setBulkValue(e.target.value)}
                className="border p-2"
              />
              <Button
                onClick={() => {
                  setTableRows(prevRows => {
                    let updatedRows = [...prevRows];
                    const affectedRows = new Set();

                    // 1. Set bulk value for selected cells
                    selectedCells.forEach(cell => {
                      updatedRows[cell.rowIndex] = {
                        ...updatedRows[cell.rowIndex],
                        [cell.columnId]: bulkValue
                      };
                      affectedRows.add(cell.rowIndex);
                    });

                    // 2. Recalculate formulas for all affected rows
                    updatedRows = updatedRows.map((row, idx) => {
                      if (!affectedRows.has(idx)) return row;

                      // --- Formula logic (copy from updateData) ---
                      const updatedRow = { ...row };
                      const total_vol_for_20nm = parseFloat(updatedRow.total_vol_for_20nm) || 0;
                      // const lib_vol_for_20nm = parseFloat(updatedRow.lib_vol_for_20nm) || 0;
                      const per_rxn_gdna = parseFloat(updatedRow.per_rxn_gdna) || 0;
                      const volume = parseFloat(updatedRow.volume) || 0;
                      const qubit_dna = parseFloat(updatedRow.qubit_dna) || 0;

                      // gdna_volume_3x
                      updatedRow.gdna_volume_3x = (qubit_dna > 0 && per_rxn_gdna > 0)
                        ? Math.round((per_rxn_gdna / qubit_dna) * 3)
                        : "";

                      // nfw
                      const gdna_volume_3x = parseFloat(updatedRow.gdna_volume_3x) || 0;
                      updatedRow.nfw = volume > 0 ? volume - gdna_volume_3x : "";

                      // nfw_volu_for_20nm
                      if (total_vol_for_20nm) {
                        const lib_vol_for_20nm = parseFloat(updatedRow.lib_vol_for_20nm) || 0;
                        updatedRow.nfw_volu_for_20nm = parseFloat((total_vol_for_20nm - lib_vol_for_20nm).toFixed(2));
                      }

                      const { lib_vol_for_20nm, nfw_volu_for_20nm } = calculateLibVolFor2nm(updatedRow, testName);
                      updatedRow.lib_vol_for_20nm = lib_vol_for_20nm;
                      updatedRow.nfw_volu_for_20nm = nfw_volu_for_20nm;

                      return updatedRow;
                    });

                    return updatedRows;
                  });
                  setBulkValue("");
                }}
              >
                Apply to Selected
              </Button>
            </div>
          )}

          <div className="mb-4 flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px]">
                  Select Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-72 overflow-y-auto w-64">
                <DropdownMenuCheckboxItem
                  onSelect={(e) => e.preventDefault()} // Prevent default behavior
                  checked={Object.values(table.getState().columnVisibility).every(Boolean)} // Check if all are visible
                  onCheckedChange={(value) =>
                    table.getAllLeafColumns().forEach((column) => column.toggleVisibility(!!value))
                  }
                >
                  Select All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => {
                    const visibleCols = getDefaultVisible(testName); // <-- get the correct default columns here
                    table.getAllLeafColumns().forEach((column) => {
                      column.toggleVisibility(visibleCols.includes(column.id));
                    });
                  }}
                >
                  Deselect All
                </DropdownMenuCheckboxItem>
                {table
                  .getAllLeafColumns()
                  .slice() // Create a copy of the array
                  .sort((a, b) => a.columnDef.header.localeCompare(b.columnDef.header)) // Sort the copied array
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.columnDef.header}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-gray-500">
              Showing {Object.values(table.getState().columnVisibility).filter(Boolean).length || columns.length} of {columns.length} columns
            </span>
          </div>


          <div className="flex items-center gap-2">
            <Checkbox
              checked={syncFirstRow}
              onCheckedChange={setSyncFirstRow}
            />
            <span>Sync all rows with first row</span>
          </div>

          <div className="">
            {/* Table */}
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow mb-6 overflow-x-auto w-full whitespace-nowrap" style={{ maxWidth: 'calc(100vw - 60px)' }}>
              <div className="overflow-y-auto" style={{ maxHeight: 700 }}>
                <table className="min-w-full border-collapse table-auto">
                  <thead className="bg-orange-100 dark:bg-gray-800 sticky top-0 z-30">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, colIdx) => {
                          const colKey = header.column.id;
                          let stickyClass = "";
                          let style = {};
                          if (colKey === "lib_vol_for_20nm") style = { maxWidth: "120px", minWidth: "100px" };
                          if (colKey === "volume_from_40nm_for_total_25ul_pool") style = { maxWidth: "120px", minWidth: "100px" };

                          if (colKey === "id") stickyClass = "sticky left-0 z-40 w-[60px]";
                          {/* if (colKey === "batch_id") stickyClass = "sticky left-[50px] z-40 w-[120px]";
                          if (colKey === "pool_no") stickyClass = "sticky left-[120px] z-40 w-[100px]"; */}
                          if (colKey === "sample_id") stickyClass = "sticky left-[40px] z-40 w-[140px]";
                          return (
                            <th
                              key={header.id}
                              onClick={header.column.getToggleSortingHandler()}
                              className={`cursor-pointer table-header px-4 py-2 text-left border-b border-gray-200 border-s-1 border-s-orange-300 sticky top-0 z-30 bg-orange-100 dark:bg-gray-800 ${stickyClass}`}
                              style={style}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          );
                        })}
                        {testName !== "Myeloid" && batchedColumns.map(colKey => (
                          <th
                            key={colKey}
                            className="px-2 py-1 border border-gray-300 font-bold bg-orange-100 border-s-1 border-s-orange-300 sticky top-0 z-30 dark:bg-gray-800 dark:text-white"
                            style={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              maxWidth: "120px", // adjust as needed
                              minWidth: "80px",  // adjust as needed
                              textAlign: "center"
                            }}
                          >
                            {allColumns.find(col => col.key === colKey)?.label || colKey}
                          </th>
                        ))}
                        <th className=""></th>
                      </tr>
                    ))}
                  </thead>
                  <tbody className="text-center">
                    {table.getRowModel().rows.map((row, rowIndex, arr) => {
                      const pool = pooledRowData.find(pool => pool.sampleIndexes.includes(rowIndex));
                      const isFirstOfPool = pool && rowIndex === Math.min(...pool.sampleIndexes);

                      const isSelected = currentSelection.includes(rowIndex);
                      const isFirstSelected = isSelected && rowIndex === Math.min(...currentSelection);

                      const currentBatchId = row.original.batch_id;
                      let batchStart = rowIndex;
                      let batchEnd = rowIndex;

                      // Find the start of the batch (move backward)
                      while (
                        batchStart > 0 &&
                        arr[batchStart - 1].original.batch_id === currentBatchId &&
                        currentBatchId
                      ) {
                        batchStart--;
                      }
                      // Find the end of the batch (move forward)
                      while (
                        batchEnd + 1 < arr.length &&
                        arr[batchEnd + 1].original.batch_id === currentBatchId &&
                        currentBatchId
                      ) {
                        batchEnd++;
                      }
                      const isFirstOfBatch = rowIndex === batchStart;
                      const isLastOfBatch = rowIndex === batchEnd;

                      const batchRows = arr.filter(r => r.original.batch_id === currentBatchId);
                      const batchSum = batchRows.reduce(
                        (sum, r) => sum + (parseFloat(r.original.data_required) || 0),
                        0
                      );

                      const firstBatchIndex = arr.findIndex(r => r.original.batch_id === currentBatchId);
                      const isLastSelected = currentSelection.length > 0 &&
                        showPooledFields &&
                        rowIndex === Math.max(...currentSelection);

                      const isLastOfPool = pool && rowIndex === Math.max(...pool.sampleIndexes);

                      // Find the last selected index
                      const lastSelectedIndex = currentSelection.length > 0 ? Math.max(...currentSelection) : null;

                      // Find the pool for the last selected index
                      const lastSelectedPool = pooledRowData.find(pool => pool.sampleIndexes.includes(lastSelectedIndex));

                      // Is this the last row of the last selected pool?
                      const isLastOfLastSelectedPool = lastSelectedPool && rowIndex === Math.max(...lastSelectedPool.sampleIndexes);

                      return (
                        <React.Fragment key={row.id}>
                          <tr>
                            {row.getVisibleCells().map((cell, colIdx) => {
                              // Pooled (existing) inputs
                              if (cell.column.id === "pool_no" && pool) {
                                // Find the sorted indexes for this pool
                                const sortedIndexes = [...pool.sampleIndexes].sort((a, b) => a - b);
                                // Only render the cell for the first selected row in the pool
                                if (rowIndex === sortedIndexes[0]) {
                                  return (
                                    <td
                                      key={cell.column.id}
                                      rowSpan={pool.sampleIndexes.length}
                                      className="align-middle px-2 py-1 border border-gray-300 font-bold bg-orange-50"
                                      style={{
                                        // Optional: visually highlight non-consecutive pooled rows
                                        borderTop: "2px solid #fbbf24",
                                        borderBottom: "2px solid #fbbf24"
                                      }}
                                    >
                                      {row.original.pool_no}
                                    </td>
                                  );
                                }
                                // For other rows in the pool, skip rendering (covered by rowspan)
                                return null;
                              }

                              if (testName === "Myeloid") {
                                if (cell.column.id === "pool_dna_rna_10ul" || cell.column.id === "pool_5ul_myeloid") {
                                  // Find all RNA and DNA rows
                                  const rnaRows = arr.filter(r => r.original.sample_type === "RNA");
                                  const dnaRows = arr.filter(r => r.original.sample_type === "DNA");
                                  const isFirstRNA = row.original.sample_type === "RNA" && rowIndex === arr.findIndex(r => r.original.sample_type === "RNA");
                                  const isFirstDNA = row.original.sample_type === "DNA" && rowIndex === arr.findIndex(r => r.original.sample_type === "DNA");

                                  if (isFirstRNA) {
                                    if (cell.column.id === "pool_dna_rna_10ul") {
                                      return (
                                        <td
                                          key={cell.column.id}
                                          rowSpan={rnaRows.length}
                                          className=" font-bold text-center align-middle border-s-1 border-y-1"
                                          style={{ verticalAlign: "middle" }}
                                        >
                                          1ul
                                        </td>
                                      );
                                    }
                                    if (cell.column.id === "pool_5ul_myeloid") {
                                      return (
                                        <td
                                          key={cell.column.id}
                                          rowSpan={rnaRows.length}
                                          className=" font-bold text-center align-middle border-s-1 border-y-1"
                                          style={{ verticalAlign: "middle" }}
                                        >
                                          RNA POOL
                                        </td>
                                      );
                                    }
                                  }
                                  if (isFirstDNA) {
                                    if (cell.column.id === "pool_dna_rna_10ul") {
                                      return (
                                        <td
                                          key={cell.column.id}
                                          rowSpan={dnaRows.length}
                                          className=" font-bold text-center align-middle border-s-1 border-y-1"
                                          style={{ verticalAlign: "middle" }}
                                        >
                                          8ul
                                        </td>
                                      );
                                    }
                                    if (cell.column.id === "pool_5ul_myeloid") {
                                      return (
                                        <td
                                          key={cell.column.id}
                                          rowSpan={dnaRows.length}
                                          className=" font-bold text-center align-middle border-s-1 border-y-1"
                                          style={{ verticalAlign: "middle" }}
                                        >
                                          DNA POOL
                                        </td>
                                      );
                                    }
                                  }
                                  // Other RNA/DNA rows: skip cell (covered by rowspan)
                                  if (row.original.sample_type === "RNA" || row.original.sample_type === "DNA") {
                                    return null;
                                  }
                                  // For other sample types, show empty cell
                                  return <td key={cell.column.id}></td>;
                                }
                                if (cell.column.id === "tapestation_conc" || cell.column.id === "tapestation_size") {
                                  // Find all DNA and RNA rows
                                  const dnaRnaRows = arr.filter(r =>
                                    r.original.sample_type === "DNA" || r.original.sample_type === "RNA"
                                  );
                                  const isFirstDnaRna =
                                    (row.original.sample_type === "DNA" || row.original.sample_type === "RNA") &&
                                    rowIndex === arr.findIndex(r =>
                                      r.original.sample_type === "DNA" || r.original.sample_type === "RNA"
                                    );

                                  if (isFirstDnaRna) {
                                    return (
                                      <td
                                        key={cell.column.id}
                                        rowSpan={dnaRnaRows.length}
                                        className="align-middle px-2 py-1 border border-gray-300"
                                      >
                                        <input
                                          className="border border-orange-300 rounded p-1 text-center w-[150px]"
                                          value={row.original[cell.column.id] || ""}
                                          onChange={e => {
                                            const value = e.target.value;
                                            // Update all DNA/RNA rows at once
                                            setTableRows(prevRows =>
                                              prevRows.map(r =>
                                                (r.sample_type === "DNA" || r.sample_type === "RNA")
                                                  ? { ...r, [cell.column.id]: value }
                                                  : r
                                              )
                                            );
                                          }}
                                          placeholder={cell.column.columnDef.header || cell.column.id}
                                        />
                                      </td>
                                    );
                                  }
                                  // For other DNA/RNA rows, skip rendering (covered by rowspan)
                                  if (row.original.sample_type === "DNA" || row.original.sample_type === "RNA") {
                                    return null;
                                  }
                                  // For other sample types, show empty cell
                                  return <td key={cell.column.id}></td>;
                                }
                              }

                              if (cell.column.id === "batch_id" && currentBatchId) {
                                if (isFirstOfBatch) {
                                  return (
                                    <td
                                      key={cell.column.id}
                                      rowSpan={batchEnd - batchStart + 1}
                                      className="align-middle px-2 py-1 border border-gray-300 font-bold bg-blue-50"
                                    >
                                      {currentBatchId}
                                    </td>
                                  );
                                }
                                return null; // skip cell covered by rowspan
                              }

                              if (cell.column.id === "select") {
                                if (pool) {
                                  if (isFirstOfPool) {
                                    return (
                                      <td
                                        key={cell.column.id}
                                        rowSpan={pool.sampleIndexes.length}
                                        className="align-middle px-2 py-1 border border-gray-300"
                                      >
                                        <Checkbox
                                          checked={rowSelection[row.id] || false}
                                          onCheckedChange={(checked) => {
                                            const newSelection = { ...rowSelection, [row.id]: checked };
                                            if (!checked) delete newSelection[row.id];
                                            setRowSelection(newSelection);
                                            setShowPooledFields(Object.values(newSelection).some(Boolean)); // <-- Ensure this line is present!
                                          }}
                                        />
                                      </td>
                                    );
                                  }
                                  return null;
                                } else {
                                  return (
                                    <td key={cell.column.id} className="align-middle px-2 py-1 border border-gray-300">
                                      <Checkbox
                                        checked={rowSelection[row.id] || false}
                                        onCheckedChange={(checked) => {
                                          const newSelection = { ...rowSelection, [row.id]: checked };
                                          if (!checked) delete newSelection[row.id];
                                          setRowSelection(newSelection);
                                          setShowPooledFields(Object.values(newSelection).some(Boolean)); // <-- Ensure this line is present!
                                        }}
                                      />
                                    </td>
                                  );
                                }
                              }

                              if (pooledColumns.includes(cell.column.id) && pool) {
                                if (isFirstOfPool) {
                                  return (
                                    <td
                                      key={cell.column.id}
                                      rowSpan={pool.sampleIndexes.length}
                                      className="align-middle px-2 py-1 border border-gray-300"
                                    >
                                      <input
                                        className="border border-orange-300 rounded text-center p-1 w-[100px]"
                                        placeholder={cell.column.columnDef.header || cell.column.id}
                                        value={pool.values[cell.column.id] || ""}
                                        onChange={e => {
                                          const value = e.target.value;
                                          setPooledRowData(prev =>
                                            prev.map(p => {
                                              if (p !== pool) return p;
                                              const updated = { ...p.values, [cell.column.id]: value };

                                              // Always use the latest value if editing a dependency
                                              const totalVolFor2nm =
                                                cell.column.id === "total_vol_for_20nm"
                                                  ? parseFloat(value) || 0
                                                  : parseFloat(updated.total_vol_for_20nm) || 0;
                                              const percentPooling =
                                                cell.column.id === "vol_for_40nm_percent_pooling"
                                                  ? parseFloat(value) || 0
                                                  : parseFloat(updated.vol_for_40nm_percent_pooling ?? 0) || 0;

                                              updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);

                                              const poolConc = parseFloat(updated.pool_conc) || 0;

                                              const size = parseFloat(updated.size) || 0;

                                              updated.nm_conc = (size > 0 && poolConc > 0)
                                                ? ((poolConc / (size * 660)) * 1000000).toFixed(2)
                                                : "";

                                              const nmConc = parseFloat(updated.nm_conc) || 0;
                                              // updated.one_tenth_of_nm_conc = (nmConc > 0) ? (nmConc / 10).toFixed(2) : "";


                                              updated.lib_vol_for_20nm = (20 * totalVolFor2nm / nmConc).toFixed(2);
                                              updated.nfw_volu_for_20nm = (totalVolFor2nm - updated.lib_vol_for_20nm).toFixed(2);

                                              return { ...p, values: updated };
                                            })
                                          );
                                          table.options.meta.updateData(pool.sampleIndexes[0], cell.column.id, value);
                                        }}
                                      />
                                    </td>
                                  );
                                }
                                return null; // Covered by rowspan
                              }


                              if (finalPoolingColumns.includes(cell.column.id) && pool) {
                                if (isFirstOfPool) {
                                  // Calculate poolSum for this pool
                                  const poolRows = pool.sampleIndexes
                                    .map(idx => arr[idx])
                                    .filter(r => r && r.original); // <-- Only keep defined rows

                                  const poolSum = poolRows.reduce(
                                    (sum, r) => sum + (parseFloat(r.original.data_required) || 0),
                                    0
                                  );
                                  // Calculate batchSum for the batch of this pool
                                  const batchRows = arr.filter(r => r.original.batch_id === row.original.batch_id);
                                  const batchSum = batchRows.reduce(
                                    (sum, r) => sum + (parseFloat(r.original.data_required) || 0),
                                    0
                                  );
                                  // Calculate percentage
                                  const percent = batchSum > 0 ? ((poolSum / batchSum) * 100).toFixed(2) : "";

                                  return (
                                    <td
                                      key={cell.column.id}
                                      rowSpan={pool.sampleIndexes.length}
                                      className="align-middle px-2 py-1 border border-gray-300"
                                    >
                                      {cell.column.id === "vol_for_40nm_percent_pooling" ? (
                                        <input
                                          className="border border-orange-300 text-center rounded p-1 w-[100px] mb-1 "
                                          value={
                                            // Only show value if batch_id exists for this pool
                                            pool.sampleIndexes.every(idx => arr[idx]?.original?.batch_id)
                                              ? (pool.values.vol_for_40nm_percent_pooling ?? percent)
                                              : ""
                                          }
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPooledRowData(prev =>
                                              prev.map(p => {
                                                if (p !== pool) return p;
                                                const updated = { ...p.values, vol_for_40nm_percent_pooling: value };

                                                const totalVolFor2nm =
                                                  cell.column.id === "total_vol_for_20nm"
                                                    ? parseFloat(value) || 0
                                                    : parseFloat(updated.total_vol_for_20nm) || 0;
                                                const percentPooling =
                                                  cell.column.id === "vol_for_40nm_percent_pooling"
                                                    ? parseFloat(value) || 0
                                                    : parseFloat(updated.vol_for_40nm_percent_pooling ?? 0) || 0;

                                                updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);

                                                return { ...p, values: updated };
                                              })
                                            );
                                            table.options.meta.updateData(pool.sampleIndexes[0], cell.column.id, value);
                                          }}
                                          placeholder="40nM vol. % pooling"
                                        />
                                      ) : (
                                        <input
                                          className="border border-orange-300 rounded text-center p-1 w-[100px]"
                                          placeholder={cell.column.columnDef.header || cell.column.id}
                                          value={pool.values[cell.column.id] || ""}
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPooledRowData(prev =>
                                              prev.map(p => {
                                                if (p !== pool) return p;
                                                const updated = { ...p.values, [cell.column.id]: value };

                                                // Always use the latest value if editing a dependency
                                                const totalVolFor2nm =
                                                  cell.column.id === "total_vol_for_20nm"
                                                    ? parseFloat(value) || 0
                                                    : parseFloat(updated.total_vol_for_20nm) || 0;
                                                const percentPooling =
                                                  cell.column.id === "vol_for_40nm_percent_pooling"
                                                    ? parseFloat(value) || 0
                                                    : parseFloat(updated.vol_for_40nm_percent_pooling) || 0;

                                                updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);

                                                return { ...p, values: updated };
                                              })
                                            );
                                            table.options.meta.updateData(pool.sampleIndexes[0], cell.column.id, value);
                                          }}
                                        />
                                      )}
                                    </td>
                                  );
                                }
                                return null; // Covered by rowspan
                              }

                              if (cell.column.id === "vol_for_40nm_percent_pooling" && pool && isFirstOfPool) {
                                return (
                                  <td key={cell.column.id} rowSpan={pool.sampleIndexes.length} className="align-middle px-2 py-1 border border-gray-300">
                                    <input
                                      className="border text-center border-orange-300 rounded p-1 w-[100px] mb-1"
                                      value={pool.values.vol_for_40nm_percent_pooling || ""}
                                      onChange={e => {
                                        const value = e.target.value;
                                        setPooledRowData(prev =>
                                          prev.map(p => {
                                            if (p !== pool) return p;
                                            const updated = { ...p.values, vol_for_40nm_percent_pooling: value };
                                            const totalVolFor2nm = parseFloat(updated.total_vol_for_20nm) || 0;
                                            const percentPooling = parseFloat(value) || 0;
                                            updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);
                                            return { ...p, values: updated };
                                          })
                                        );
                                        table.options.meta.updateData(pool.sampleIndexes[0], cell.column.id, value);
                                      }}
                                      placeholder="40nM vol. % pooling"
                                    />
                                  </td>
                                );
                              }

                              if (cell.column.id === "volume_from_40nm_for_total_25ul_pool" && pool && isFirstOfPool) {
                                const totalVolFor2nm = parseFloat(pool.values.total_vol_for_20nm) || 0;
                                const percentPooling = parseFloat(pool.values.vol_for_40nm_percent_pooling) || 0;
                                const var_name = ((totalVolFor2nm * percentPooling) / 100).toFixed(2);
                                return (
                                  <td key={cell.column.id} rowSpan={pool.sampleIndexes.length} className="align-middle px-2 py-1 border border-gray-300">
                                    <input
                                      className="border text-center border-orange-300 text-black dark:text-white rounded p-1 w-[100px]"
                                      placeholder={cell.column.columnDef.header || cell.column.id}
                                      value={pool.values.volume_from_40nm_for_total_25ul_pool || ""}
                                      readOnly
                                    />
                                  </td>
                                );
                              }

                              // Pooled (new) inputs
                              if (
                                pooledColumns.includes(cell.column.id) &&
                                showPooledFields &&
                                isFirstSelected
                              ) {
                                return (
                                  <td
                                    key={cell.column.id}
                                    rowSpan={currentSelection.length}
                                    className="align-middle px-2 py-1 border border-gray-300"
                                  >
                                    <input
                                      className="border border-orange-300 rounded p-1 w-[100px]"
                                      placeholder={cell.column.columnDef.header || cell.column.id}
                                      value={pool?.values[cell.column.id] || ""}
                                      onChange={e => {
                                        const value = e.target.value;
                                        setPooledRowData(prev =>
                                          prev.map(p => {
                                            if (p !== pool) return p;
                                            const updated = { ...p.values, [cell.column.id]: value };

                                            // Always use the latest value if editing a dependency
                                            const totalVolFor2nm =
                                              cell.column.id === "total_vol_for_20nm"
                                                ? parseFloat(value) || 0
                                                : parseFloat(updated.total_vol_for_20nm) || 0;
                                            const percentPooling =
                                              cell.column.id === "vol_for_40nm_percent_pooling"
                                                ? parseFloat(value) || 0
                                                : parseFloat(updated.vol_for_40nm_percent_pooling ?? 0) || 0;

                                            const qubit_dna = parseFloat(updated.qubit_dna) || 0;

                                            updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);

                                            const poolConc = parseFloat(updated.pool_conc) || 0;

                                            const size = parseFloat(updated.size) || 0;

                                            updated.nm_conc = (size > 0 && poolConc > 0)
                                              ? ((poolConc / (size * 660)) * 1000000).toFixed(2)
                                              : "";

                                            const nmConc = parseFloat(updated.nm_conc) || 0;
                                            // updated.one_tenth_of_nm_conc = (nmConc > 0) ? (nmConc / 10).toFixed(2) : "";

                                            if (cell.column.id === "lib_vol_for_20nm" || cell.column.id === "nm_conc" || cell.column.id === "one_tenth_of_nm_conc") {
                                              const nmConc = parseFloat(updated.nm_conc) || 0;
                                              const libVolFor2nm = parseFloat(updated.lib_vol_for_20nm) || 0;

                                              updated.total_vol_for_20nm = (updated.one_tenth_of_nm_conc && libVolFor2nm)
                                                ? (parseFloat(updated.one_tenth_of_nm_conc) * libVolFor2nm / 2).toFixed(2)
                                                : "";

                                              updated.nfw_volu_for_20nm = (totalVolFor2nm && libVolFor2nm)
                                                ? (totalVolFor2nm - libVolFor2nm).toFixed(2)
                                                : "";
                                            }

                                            if (testName === "HLA" && qubit_dna) {
                                              updated.dna_vol_for_dilution = qubit_dna > 0 ? (400 / qubit_dna).toFixed(2) : "";
                                              updated.buffer_vol_to_be_added = (10 - updated.dna_vol_for_dilution).toFixed(2);
                                            }

                                            if (cell.column.id === "conc_of_amplicons") {
                                              updated.vol_for_fragmentation = conc_of_amplicons > 0 ? (Math.round((250 / updated.conc_of_amplicons) * 10) / 10).toFixed(1) : "";
                                            }

                                            if (cell.column.id === "total_vol_for_20nm") {
                                              const libVolFor2nm = parseFloat(updated.lib_vol_for_20nm) || 0;
                                              updated.nfw_volu_for_20nm = (value && libVolFor2nm)
                                                ? (parseFloat(value) - libVolFor2nm).toFixed(2)
                                                : "";
                                            }

                                            updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);

                                            return { ...p, values: updated };
                                          })
                                        );
                                        table.options.meta.updateData(pool.sampleIndexes[0], cell.column.id, value);
                                      }}
                                    />
                                  </td>
                                );
                              }

                              if (
                                pooledColumns.includes(cell.column.id) &&
                                ((showPooledFields && isSelected) || pool)
                              ) {
                                return null; // skip cell covered by rowspan
                              }

                              if (finalPoolingColumns.includes(cell.column.id) && pool) {
                                if (isFirstOfPool) {
                                  return (
                                    <td
                                      key={cell.column.id}
                                      rowSpan={pool.sampleIndexes.length}
                                      className="align-middle px-2 py-1 border border-gray-300"
                                    >
                                      <input
                                        className="border border-orange-300 text-black dark:text-white rounded p-1 w-[100px]"
                                        placeholder={cell.column.columnDef.header || cell.column.id}
                                        value={pool.values[cell.column.id] || ""}
                                        onChange={e => {
                                          const value = e.target.value;
                                          setPooledRowData(prev =>
                                            prev.map(p => {
                                              if (p !== pool) return p;
                                              const updated = { ...p.values, [cell.column.id]: value };

                                              // Always use the latest value if editing a dependency
                                              const totalVolFor2nm =
                                                cell.column.id === "total_vol_for_20nm"
                                                  ? parseFloat(value) || 0
                                                  : parseFloat(updated.total_vol_for_20nm) || 0;
                                              const percentPooling =
                                                cell.column.id === "vol_for_40nm_percent_pooling"
                                                  ? parseFloat(value) || 0
                                                  : parseFloat(updated.vol_for_40nm_percent_pooling) || 0;

                                              updated.volume_from_40nm_for_total_25ul_pool = (totalVolFor2nm * (percentPooling / 100)).toFixed(2);
                                              return { ...p, values: updated };
                                            })
                                          );
                                          table.options.meta.updateData(pool.sampleIndexes[0], cell.column.id, value);
                                        }}
                                      />
                                    </td>
                                  );
                                }
                                return null; // Covered by rowspan
                              }
                              // Default cell render
                              let stickyClass = "";
                              if (cell.column.id === "id") stickyClass = "sticky left-0 z-20 w-[60px] bg-white dark:bg-gray-900";
                              {/* if (cell.column.id === "batch_id") stickyClass = "sticky left-[50px] z-20 w-[120px] bg-white dark:bg-gray-900";
                              if (cell.column.id === "pool_no") stickyClass = "sticky left-[120px] z-20 w-[100px] bg-white dark:bg-gray-900"; */}
                              if (cell.column.id === "sample_id") stickyClass = "sticky left-[40px] z-20 w-[140px] bg-white dark:bg-gray-900";
                              return (
                                <td
                                  key={cell.column.id}
                                  className={`px-4 py-1 border-b border-gray-100 ${stickyClass}`}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              );
                            })}

                            {testName !== "Myeloid" && batchedColumns.map((colKey) => {
                              if (isFirstOfBatch) {
                                const batchRows = arr.filter(r => r.original.batch_id === currentBatchId);
                                const firstBatchRow = batchRows[0];

                                let value = firstBatchRow?.original[colKey] ?? "";
                                if (colKey === "size_for_2nm") {
                                  // Find all pools in this batch
                                  const poolsInBatch = pooledRowData.filter(pool =>
                                    pool.sampleIndexes.some(idx => arr[idx]?.original.batch_id === currentBatchId)
                                  );
                                  // Get all pool sizes (as numbers)
                                  const poolSizes = poolsInBatch
                                    .map(pool => parseFloat(pool.values.size))
                                    .filter(size => !isNaN(size) && size > 0);
                                  // Calculate average
                                  const avgSize = poolSizes.length
                                    ? (poolSizes.reduce((a, b) => a + b, 0) / poolSizes.length).toFixed(2)
                                    : "";

                                  // If the batchRows don't have the correct size_for_2nm, update them and recalculate nm_conc_for_2nm
                                  if (avgSize && batchRows.some(r => r.original.size_for_2nm !== avgSize)) {
                                    setTimeout(() => {
                                      setTableRows(prevRows =>
                                        prevRows.map(r => {
                                          if (r.batch_id !== currentBatchId) return r;
                                          const libQubitFor2nm = parseFloat(r.lib_qubit_for_2nm) || 0;
                                          const sizeFor2nm = parseFloat(avgSize) || 0;
                                          const nmConcFor2nm =
                                            sizeFor2nm > 0 && libQubitFor2nm > 0
                                              ? ((libQubitFor2nm / (sizeFor2nm * 660)) * 1000000).toFixed(2)
                                              : "";
                                          return {
                                            ...r,
                                            size_for_2nm: avgSize,
                                            nm_conc_for_2nm: nmConcFor2nm,
                                          };
                                        })
                                      );
                                    }, 0);
                                  }
                                  value = avgSize;
                                }
                                return (
                                  <td
                                    key={colKey}
                                    rowSpan={batchRows.length}
                                    className="align-middle px-2 py-1 border border-gray-300"
                                  >
                                    <input
                                      type='text'
                                      className="border border-orange-300 text-center rounded p-1 w-[100px]"
                                      placeholder={`${allColumns.find(col => col.key === colKey)?.label || colKey}`}
                                      value={value}
                                      readOnly={colKey === "size_for_2nm"}
                                      onChange={colKey === "size_for_2nm" ? undefined : (e => {
                                        const value = e.target.value;
                                        setTableRows(prevRows =>
                                          prevRows.map(r => {
                                            if (r.batch_id !== currentBatchId) return r;
                                            let updated = { ...r, [colKey]: value };

                                            if (colKey === "lib_qubit_for_2nm" || colKey === "size_for_2nm") {
                                              const libQubitFor2nm = parseFloat(updated.lib_qubit_for_2nm) || 0;
                                              const sizeFor2nm = parseFloat(updated.size_for_2nm) || 0;
                                              updated.nm_conc_for_2nm = (sizeFor2nm > 0 && libQubitFor2nm > 0)
                                                ? ((libQubitFor2nm / (sizeFor2nm * 660)) * 1000000).toFixed(2)
                                                : "";
                                            }

                                            if (colKey === "total_vol_for_2nm" || colKey === "nm_conc_for_2nm") {
                                              const nmConcFor2nm = parseFloat(updated.nm_conc_for_2nm) || 0;
                                              const totalVolFor2nm = parseFloat(updated.total_vol_for_2nm) || 0;
                                              updated.lib_vol_for_2nm = (nmConcFor2nm > 0 && totalVolFor2nm > 0)
                                                ? (2 * (totalVolFor2nm / nmConcFor2nm)).toFixed(2)
                                                : "";
                                              updated.nfw_vol_for_2nm = (totalVolFor2nm - updated.lib_vol_for_2nm).toFixed(2);
                                            }

                                            return updated;
                                          })
                                        );
                                      })}
                                    />
                                  </td>
                                );
                              }
                              return null;
                            })}

                            <td className="align-middle px-2 py-1 border border-gray-300">
                              <div className="flex items-center gap-2">
                                {!row.original.pool_no && pooledRowData.length > 0 && (
                                  <select
                                    onChange={e => handleAddSampleToPool(row.index, e.target.value)}
                                    defaultValue=""
                                    className="border border-orange-300 rounded-lg p-2 bg-white text-sm focus:ring-2 focus:ring-orange-400 transition"
                                  >
                                    <option value="">Add to Pool</option>
                                    {pooledRowData
                                      .filter(pool => !pool.values.batch_id)
                                      .map(pool => (
                                        <option key={pool.values.pool_no} value={pool.values.pool_no}>
                                          {pool.values.pool_no}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-lg px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 transition"
                                  onClick={() => {
                                    setDialogOpen(true);
                                    setDialogRowInfo(row.original);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {isLastSelected && !pool && showPooledFields && (
                            <tr>
                              <td colSpan={columns.length} className="py-2 px-4">
                                <div className="w-[250px] flex justify-around">
                                  <Button onClick={handleCreatePool} className="text-white text-sm px-4 py-1 rounded bg-black">
                                    Create Pool
                                  </Button>

                                </div>
                              </td>
                            </tr>
                          )}


                          {isLastOfLastSelectedPool && showPooledFields && (
                            <tr>
                              <td colSpan={columns.length} className="py-2 px-4">
                                <div className="w-[250px] flex justify-around">
                                  <Button onClick={handleCreateBatch} className="text-white text-sm px-4 py-1 rounded bg-black">
                                    Create Batch
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                          }

                          {isLastOfBatch && currentBatchId && (
                            <tr>
                              {/* Empty cells before data_required */}
                              {Array.from({ length: dataRequiredVisibleIdx }).map((_, idx) => (
                                <td key={idx}></td>
                              ))}
                              {/* Total cell under data_required */}
                              <td className="font-bold text-xl py-3 text-center">
                                Total: {batchSum}
                              </td>
                              {/* Empty cells after data_required */}
                              {Array.from({ length: visibleColumns.length - dataRequiredVisibleIdx - 1 }).map((_, idx) => (
                                <td key={dataRequiredVisibleIdx + 1 + idx}></td>
                              ))}
                            </tr>
                          )}



                        </React.Fragment>
                      );
                    })}

                    {testName === "Myeloid" && (
                      <tr>
                        {/* Empty cells before data_required */}
                        {Array.from({ length: dataRequiredVisibleIdx }).map((_, idx) => (
                          <td key={idx}></td>
                        ))}
                        {/* Total cell under data_required */}
                        <td className="font-bold text-xl py-3 text-center">
                          Total: {myeloidTotal}
                        </td>
                        {/* Empty cells after data_required */}
                        {Array.from({ length: visibleColumns.length - dataRequiredVisibleIdx - 1 }).map((_, idx) => (
                          <td key={dataRequiredVisibleIdx + 1 + idx}></td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
          {/* <Button
            type="button"
            onClick={handleSaveAll}
            className="bg-green-600 hover:bg-green-700 mt-5 text-white cursor-pointer mx-2 min-w-[120px] h-12"
          >
            Save All
          </Button> */}
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={processing}
            className="bg-gray-700 hover:bg-gray-800 mt-5 text-white cursor-pointer min-w-[120px] h-12">
            {processing ? 'Saving...' : 'Save'}
          </Button>

          <Button
            type='button'
            className='text-white ms-2 bg-red-600 hover:bg-red-700 mt-5 cursor-pointer min-w-[120px] h-12'
            onClick={() => {
              setActiveTab("processing");
              localStorage.removeItem('libraryPreparationData');
              localStorage.removeItem('selectedLibraryPrepSamples');
              setMessage(1);
            }}
          >
            Remove All
          </Button>
        </>
        )
        :
        (
          <div className="text-center text-red-500  mb-4">
            No data available for Library Preparation. Please add some from
            <span
              className="cursor-pointer underline font-bold"
              onClick={() => dispatch(setActiveTab("processing"))}> Processing Tab</span>
          </div>
        )
      }


      {/* Column Selector Dropdown */}
      <DialogBox
        isOpen={DialogOpen}
        onClose={() => setDialogOpen(false)}
        user_email={user?.email}
        rowInfo={dialogRowInfo}
        onRemove={(removedInternalId) => {
          // Always reload from localStorage after removal
          const storedData = JSON.parse(localStorage.getItem('libraryPreparationData')) || {};
          const testData = storedData[testName];
          if (testData) {
            setTableRows(sortRowsByBatchAndPool(Array.isArray(testData) ? testData : testData.rows || []));
            setPooledRowData(Array.isArray(testData) ? [] : testData.pools || []);
          } else {
            setTableRows([]);
            setPooledRowData([]);
          }
          setDialogRowInfo(null);
        }}
        user_hospital_name={user?.hospital_name}
      />
      <ToastContainer />
    </div>
  )
}

export default LibraryPrepration

const DialogBox = ({ isOpen, onClose, user_email, onRemove, rowInfo, user_hospital_name }) => {
  const [repeatType, setRepeatType] = useState("");
  const [comments, setComments] = useState("");

  const removeInternalIdFromLocalStorage = (internal_id, testName) => {
    // Remove from selectedLibraryPrepSamples
    const selectedIds = JSON.parse(localStorage.getItem("selectedLibraryPrepSamples") || "[]");
    const updatedIds = selectedIds.filter(id => id !== internal_id);
    localStorage.setItem("selectedLibraryPrepSamples", JSON.stringify(updatedIds));

    // Remove from libraryPreparationData
    const libraryData = JSON.parse(localStorage.getItem("libraryPreparationData") || "{}");
    if (libraryData[testName]) {
      // Remove from rows
      let rows = Array.isArray(libraryData[testName])
        ? libraryData[testName]
        : (libraryData[testName].rows || []);
      rows = rows.filter(r => r.internal_id !== internal_id);

      // Remove from pools and recalculate sampleIndexes
      let pools = Array.isArray(libraryData[testName])
        ? []
        : (libraryData[testName].pools || []);
      pools = pools
        .map(pool => ({
          ...pool,
          sampleInternalIds: (pool.sampleInternalIds || []).filter(id => id !== internal_id)
        }))
        .filter(pool => pool.sampleInternalIds.length > 0)
        .map(pool => ({
          ...pool,
          sampleIndexes: pool.sampleInternalIds
            .map(id => rows.findIndex(r => r.internal_id === id))
            .filter(idx => idx !== -1)
        }));

      // Save back to localStorage
      if (Array.isArray(libraryData[testName])) {
        libraryData[testName] = rows;
      } else {
        libraryData[testName].rows = rows;
        libraryData[testName].pools = pools;
      }

      // If no rows and no pools left, remove the testName key
      const rowsLeft = Array.isArray(libraryData[testName])
        ? libraryData[testName].length
        : (libraryData[testName].rows || []).length;
      const poolsLeft = Array.isArray(libraryData[testName])
        ? 0
        : (libraryData[testName].pools || []).length;
      if (rowsLeft === 0 && poolsLeft === 0) {
        delete libraryData[testName];
      }

      localStorage.setItem("libraryPreparationData", JSON.stringify(libraryData));
    }
  };

  const handleRepeat = async (type, comments) => {
    if (!type) {
      toast.error("Please select a repeat type.");
      return;
    }
    if (!comments || comments.trim() === "") {
      toast.error("Please enter a reason for the repeat.");
      return;
    }
    try {
      const getPoolData = await axios.get(`/api/pool-data/get-pool?sample_id=${rowInfo.sample_id}`);
      if (getPoolData.data[0].message === "Pool data not found") {
        const payload = {
          rows: [rowInfo],
          testName: rowInfo.test_name?.includes(" + Mito")
            ? rowInfo.test_name.split(" + Mito")[0].trim()
            : rowInfo.test_name,
          hospital_name: user_hospital_name,
        }
        const insertPoolData = await axios.post('/api/pool-data', payload)
        if (insertPoolData.data[0].status !== 200) {
          toast.error("cannot create repeat sample");
          return;
        }
      }
      const res = await axios.post('/api/repeat-sample', {
        repeat_type: type,
        comments: comments,
        sample_id: rowInfo.sample_id,
        user_email: user_email,
      });
      if (res.data[0].status === 200) {
        toast.success("Repeat sample created successfully!");
        const row = res.data[0].data;

        const selectedIds = JSON.parse(localStorage.getItem("selectedLibraryPrepSamples") || "[]");
        if (!selectedIds.includes(row.internal_id)) {
          selectedIds.push(row.internal_id);
          localStorage.setItem("selectedLibraryPrepSamples", JSON.stringify(selectedIds));
        }

        // Remove the original sample (not the new repeat)
        const testName = rowInfo.test_name?.includes(" + Mito")
          ? rowInfo.test_name.split(" + Mito")[0].trim()
          : rowInfo.test_name;
        removeInternalIdFromLocalStorage(rowInfo.internal_id, testName);

        // Insert the new row into localStorage under the correct test_name
        const libraryData = JSON.parse(localStorage.getItem("libraryPreparationData") || "{}");
        const repeatTestName = row.test_name?.includes(" + Mito")
          ? row.test_name.split(" + Mito")[0].trim()
          : row.test_name;

        if (!libraryData[repeatTestName]) {
          libraryData[repeatTestName] = { rows: [], pools: [] };
        } else if (Array.isArray(libraryData[repeatTestName])) {
          libraryData[repeatTestName] = { rows: libraryData[repeatTestName], pools: [] };
        }

        // Prevent duplicate sample_ids
        const exists = (libraryData[repeatTestName].rows || []).some(r => r.internal_id === row.internal_id);
        if (!exists) {
          libraryData[repeatTestName].rows.push(row);
        }

        localStorage.setItem("libraryPreparationData", JSON.stringify(libraryData));

        await axios.put("/api/store", {
          internal_id: rowInfo.internal_id,
          updates: { is_repeated: "True" },
        });

        if (typeof onRemove === "function") onRemove(rowInfo.internal_id);
        onClose();
      } else {
        toast.error(res.data[0].message || "Failed to create repeat sample.");
      }
    }
    catch (error) {
      console.error("Error handling repeat:", error);
      // toast.error("An error occurred while processing the repeat request.");
    }
  }

  const handleRemoveSample = async (comments) => {
    if (!rowInfo) return;
    try {
      // Remove from localStorage
      const libraryData = JSON.parse(localStorage.getItem("libraryPreparationData") || "{}");
      const testName = rowInfo.test_name?.includes(" + Mito")
        ? rowInfo.test_name.split(" + Mito")[0].trim()
        : rowInfo.test_name;

      removeInternalIdFromLocalStorage(rowInfo.internal_id, testName);

      if (libraryData[testName]) {
        // Remove from rows
        let rows = Array.isArray(libraryData[testName])
          ? libraryData[testName]
          : (libraryData[testName].rows || []);
        rows = rows.filter(r => r.internal_id !== rowInfo.internal_id);

        // Remove from pools and recalculate sampleIndexes
        let pools = Array.isArray(libraryData[testName])
          ? []
          : (libraryData[testName].pools || []);
        pools = pools
          .map(pool => ({
            ...pool,
            sampleInternalIds: (pool.sampleInternalIds || []).filter(id => id !== internal_id)
          }))
          .filter(pool => pool.sampleInternalIds.length > 0)
          .map(pool => ({
            ...pool,
            sampleIndexes: pool.sampleInternalIds
              .map(id => rows.findIndex(r => r.internal_id === id))
              .filter(idx => idx !== -1)
          }));

        // Save back to localStorage
        if (Array.isArray(libraryData[testName])) {
          libraryData[testName] = rows;
        } else {
          libraryData[testName].rows = rows;
          libraryData[testName].pools = pools;
        }

        // If no rows and no pools left, remove the testName key
        const rowsLeft = Array.isArray(libraryData[testName])
          ? libraryData[testName].length
          : (libraryData[testName].rows || []).length;
        const poolsLeft = Array.isArray(libraryData[testName])
          ? 0
          : (libraryData[testName].pools || []).length;
        if (rowsLeft === 0 && poolsLeft === 0) {
          delete libraryData[testName];
        }

        localStorage.setItem("libraryPreparationData", JSON.stringify(libraryData));
      }

      // Update backend location to "monitering"
      await axios.put("/api/store", {
        internal_id: rowInfo.internal_id,
        updates: { location: "monitering" },
        auditLog: {
          sample_id: rowInfo.sample_id,
          changed_by: user_email,
          comments: comments,
          changed_at: new Date().toISOString(),
          hospital_name: user_hospital_name,
        }
      });

      toast.success("Sample removed successfully!");
      if (typeof onRemove === "function") onRemove(rowInfo.internal_id);
      onClose();
    } catch (error) {
      toast.error("Failed to remove sample.");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Repeat or Remove Sample?</DialogTitle>
        </DialogHeader>
        <div>
          <span className="font-bold">Do you want to repeat or remove this sample?</span>
          <div className="flex gap-2 justify-start mt-2">
            <select
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800"
              name='repeat_type'
              value={repeatType}
              onChange={e => {
                setRepeatType(e.target.value);
                setComments(""); // Reset comments on type change
              }}
            >
              <option value="">Select</option>
              <option value="repeat_from_library">Repeat From Library</option>
              <option value="other">Other</option>
            </select>
            <div>
              <input
                type='text'
                name='comments'
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder={
                  repeatType === "repeat_from_library"
                    ? "Enter repeat reason"
                    : "Enter reason"
                }
                className="border-2 border-orange-300 rounded-md p-2"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          {repeatType === "repeat_from_library" ? (
            <Button
              className='bg-green-400 text-white hover:bg-green-500 cursor-pointer'
              onClick={() => handleRepeat(document.querySelector('select[name="repeat_type"]').value, document.querySelector('input[name="comments"]').value)}
            >
              Repeat
            </Button>
          ) : repeatType === "other" ? (
            <Button
              variant="destructive"
              className="bg-red-500 text-white hover:bg-red-600 cursor-pointer"
              onClick={() => handleRemoveSample(document.querySelector('input[name="comments"]').value)}
            >
              Remove Sample
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
