import React, { use, useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch } from "react-redux";
import { setActiveTab } from "@/lib/redux/slices/tabslice";
import Cookies from "js-cookie";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { set } from "lodash";

const Processing = () => {
  // const defaultUser = {
  //     username: "ankit",
  //     email: "ankit@strivebiocorp.com",
  //     hospital_name: "SOI",
  //     hospital_id: "101",
  //     role: "AdminUser",
  //     user_login: 57,
  //     name: "Ankit Bhadauriya",
  //     created_at: "2025-06-08T04:00:00.000Z",
  //     enable_management: "Yes"
  //   };
  //   if (typeof window !== "undefined" && !Cookies.get('vide_user')) {
  //     Cookies.set('vide_user', JSON.stringify(defaultUser), { expires: 7, path: '/' });
  //   }
    const user = JSON.parse(Cookies.get('vide_user') || '{}');
  const [processing, setProcessing] = useState(false);
  const [sendSamplesProcessing, setSendSamplesProcessing] = useState(false);
  const [showAuditSidebar, setShowAuditSidebar] = useState(false);
  const [auditSampleId, setAuditSampleId] = useState("");
  const [auditData, setAuditData] = useState([]);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [repeatRow, setRepeatRow] = useState(null);
  const indicatorKeys = ["dna_isolation", "lib_prep", "under_seq", "seq_completed"];

  const allColumns = [
    // registration and identification columns
    { key: 'registration_date', label: 'Registration Date' },
    { key: 'sample_id', label: 'Patient ID' },
    { key: 'internal_id', label: 'Lab ID' },
    { key: 'run_id', label: 'Run ID' },
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'pool_no', label: 'Pool No' },
    { key: 'lib_prep_date', label: 'Library Prep Date' },
    { key: 'seq_run_date', label: 'Seq Run Date' },
    { key: 'patient_name', label: 'Patient Name' },
    { key: 'test_name', label: 'Test Name' },
    { key: 'DOB', label: 'DOB' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'collection_date_time', label: 'Collection Date Time' },
    { key: 'sample_date', label: 'Sample Receiving Date and Time' },
    { key: 'sample_type', label: 'Sample Type' },
    { key: 'trf', label: 'TRF' },
    { key: 'specimen_quality', label: 'Specimen Quality' },
    { key: 'prority', label: 'Prority' },
    { key: 'storage_condition', label: 'Storage Condition' },
    { key: 'vial_received', label: 'Vial Received' },
    { key: 'repeat_required', label: 'Repeat Required' },
    { key: 'repeat_reason', label: 'Repeat Reason' },
    { key: 'repeat_date', label: 'Repeat Date' },
    { key: 'father_mother_name', label: 'Father/Mother Name' },
    { key: 'patient_email', label: "Patient Email" },
    { key: 'patient_mobile', label: "Patient's Mobile" },
    { key: 'ethnicity', label: 'Ethnicity' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_name', label: 'Client Name' },
    { key: 'clinical_history', label: 'Clinical History' },
    { key: 'hpo_id', label: 'HPO ID' },
    { key: 'hpo_term', label: 'HPO Term' },
    { key: 'docter_name', label: 'Doctor Name' },
    { key: 'dept_name', label: 'Department Name' },
    { key: 'docter_mobile', label: "Doctor's Mobile" },
    { key: 'email', label: "Doctor's Email" },
    { key: 'remarks', label: 'Remarks' },
    { key: 'systolic_bp', label: 'Systolic BP' },
    { key: 'diastolic_bp', label: 'Diastolic BP' },
    { key: 'total_cholesterol', label: 'Total Cholesterol' },
    { key: 'hdl_cholesterol', label: 'HDL Cholesterol' },
    { key: 'ldl_cholesterol', label: 'LDL Cholesterol' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'smoker', label: 'Smoker' },
    { key: 'hypertension_treatment', label: 'Hypertension Treatment' },
    { key: 'statin', label: 'Statin' },
    { key: 'aspirin_therapy', label: 'Aspirin Therapy' },
    { key: 'dna_isolation', label: 'DNA Isolation' },
    { key: 'lib_prep', label: 'Library Prep' },
    { key: 'under_seq', label: 'Under Sequencing' },
    { key: 'seq_completed', label: 'Sequencing Completed' },

    //library preparation columns
    { key: 'qubit_dna', label: 'Qubit DNA' },
    { key: 'per_rxn_gdna', label: 'Per RXN GDNA' },
    { key: 'volume', label: 'Volume' },
    { key: 'gdna_volume_3x', label: 'GDNA Volume 3X' },
    { key: 'nfw', label: 'NFW' },
    { key: 'qubit_lib_qc_ng_ul', label: 'Qubit Lib QC NG/UL' },
    { key: 'lib_vol_for_hyb', label: 'Lib Vol for HYB' },

    { key: 'lib_qubit', label: 'Lib Qubit' },
    { key: 'conc_rxn', label: 'Conc RXN' },
    { key: 'nm_conc', label: 'NM Conc' },
    { key: 'nfw_volu_for_20nm', label: 'NFW Volu for 2nm' },
    { key: 'total_vol_for_20nm', label: 'Total Vol for 2nm' },
    { key: 'lib_vol_for_20nm', label: 'Lib Vol for 2nm' },
    { key: 'size', label: 'Size' },
    { key: 'pool_conc', label: 'Pool Conc' },
    { key: 'lib_qubit_for_2nm', label: 'Batch Qubit (ng/ul)' },
    { key: 'size_for_2nm', label: 'Average Size' },
    { key: 'nm_conc_for_2nm', label: 'nM Conc' },
    { key: 'lib_vol_for_2nm', label: 'Volume from Stock library for 2nM' },
    { key: 'nfw_vol_for_2nm', label: 'NFW Volume For 2nM' },
    { key: 'total_vol_for_2nm', label: 'Total Volume For 2nM' },

    { key: 'vol_for_40nm_percent_pooling', label: '20nM vol. % pooling' },
    { key: 'volume_from_40nm_for_total_25ul_pool', label: 'Volume from 20nM for Total 25ul Pool' },
    { key: 'tapestation_conc', label: 'TapeStation/Qubit QC ng/ul RNA/DNA Pool (Myeloid)' },
    { key: 'tapestation_size', label: 'Average bp  Size (Myeloid)' },

    { key: 'pooling_volume', label: 'Pooling Volume (SGS)' },
    { key: 'dna_vol_for_dilution', label: 'DNA Vol for Dilution (HLA)' },
    { key: 'buffer_vol_to_be_added', label: 'Buffer Vol (HLA)' },
    { key: 'conc_of_amplicons', label: 'Conc of Amplicons (HLA)' },
    { key: 'vol_for_fragmentation', label: 'Volume for Fragmentation (HLA)' },

    { key: 'plate_designation', label: 'Plate Designation' },
    { key: 'well', label: 'Well' },
    { key: 'i5_index_reverse', label: 'I5 Index Reverse' },
    { key: 'i7_index', label: 'I7 Index' },
    { key: 'i5_index_forward', label: 'I5 Index Forward' },
    { key: 'data_required', label: 'Data Required' },

    // run setup columns
    { key: 'final_pool_vol_ul', label: 'Final Pool Vol (ul)' },
    { key: 'total_required', label: 'Total Required (GB)' },
    { key: 'total_gb_available', label: 'Total Available (GB)' },
    { key: 'pool_conc_run_setup', label: 'Final Pool Concentration (Qubit)' },
    { key: 'pool_size', label: 'Average Final Pool Size (Tapestation)' },
    { key: 'nm_cal', label: 'Final Pool nM Concentration' },
    { key: 'instument_type', label: 'Instrument Type' },
    { key: 'total_volume_2nm_next_seq_550', label: 'Total Volume 2nm (Next Seq 550)' },
    { key: 'final_pool_conc_vol_2nm_next_seq_550', label: 'Final Pool Conc Vol 2nm (Next Seq 550)' },
    { key: 'nfw_vol_2nm_next_seq_550', label: 'NFW 2nm (Next Seq 550)' },
    { key: 'dinatured_lib_next_seq_550', label: 'Stock Conc (Next Seq 550)' },
    { key: 'total_volume_next_seq_550', label: 'Total Volume (Next Seq 550)' },
    { key: 'loading_conc_550', label: 'Required Concentration (Next Seq 550)' },
    { key: 'lib_required_next_seq_550', label: 'Volume from Stock (Next Seq 550)' },
    { key: 'buffer_volume_next_seq_550', label: 'HT Buffer (Next Seq 550)' },
    { key: 'total_volume_2nm_next_seq_1000_2000', label: 'Total Volume 2nm (Next Seq 1000-2000)' },
    { key: 'final_pool_conc_vol_2nm_next_seq_1000_2000', label: 'Final Pool Conc Vol 2nm (Next Seq 1000-2000)' },
    { key: 'rsbetween_vol_2nm_next_seq_1000_2000', label: 'RSB tween-20 2nm (Next Seq 1000-2000)' },
    { key: 'loading_conc_1000_2000', label: 'Loading Concentration (Next Seq 1000-2000)' },
    { key: 'total_volume_600pm_next_seq_1000_2000', label: 'Total Volume 600pm (Next Seq 1000-2000)' },
    { key: 'vol_of_2nm_for_600pm_next_seq_1000_2000', label: 'Volume of 2nM conc 600pM (Next Seq 1000-2000)' },
    { key: 'vol_of_rs_between_for_600pm_next_seq_1000_2000', label: 'Volume of RSB tween-20 for 600pm (Next Seq 1000-2000)' },
    { key: 'run_remarks', label: 'Run Remarks' },

    // reporting columns
    { key: 'q30', label: 'Q 30 >=' },
    { key: 'raw_data_gen', label: 'Raw Data Generated' },
    { key: 'duplication_rate', label: 'Duplication Rate' },
    { key: 'gc_control', label: 'GC Content' },
    { key: 'data_qc', label: 'Data QC' },
    { key: 'secondary_analysis', label: 'Secondary Analysis' },
    { key: 'hpo_status', label: 'HPO Status' },
    { key: 'annotation', label: 'Annotation' },
    { key: 'report_link', label: 'Report Link' },
    { key: 'mito_report_link', label: 'Mito Report Link' },
    { key: 'report_status', label: 'Report Status' },
    { key: 'report_releasing_date', label: 'Report Releasing Date' },
  ];

  // const allTests = [
  //   'WES',
  //   'Carrier Screening',
  //   'CES',
  //   'Myeloid',
  //   'HLA',
  //   'SGS',
  //   // 'WES + Mito',
  //   'HCP',
  //   'HRR',
  //   // 'CES + Mito',
  //   'SolidTumor Panel',
  //   'Cardio Comprehensive (Screening)',
  //   'Cardio Metabolic Syndrome (Screening)',
  //   'Cardio Comprehensive Myopathy'
  // ];

  const testNameShortMap = {
    "Cardio Comprehensive Myopathy": { short: "CMP", full: "Cardio Comprehensive Myopathy" },
    "Cardio Metabolic Syndrome (Screening)": { short: "CMS", full: "Cardio Metabolic Syndrome" },
    "Cardio Comprehensive (Screening)": { short: "CCS", full: "Cardio Comprehensive (Screening)" },
    "SolidTumor Panel": { short: "STP", full: "SolidTumor Panel" },
    "WES": { short: "WES", full: "Whole Exome Sequencing" },
    "Carrier Screening": { short: "CS", full: "Carrier Screening" },
    "CES": { short: "CES", full: "Clinical Exome Sequencing" },
    "Myeloid": { short: "Myeloid", full: "Myeloid" },
    "HCP": { short: "HCP", full: "Hereditary Cancer Panel" },
    "HRR": { short: "HRR", full: "Hereditary Retinal Disorders" },
    "SGS": { short: "SGS", full: "Shallow Genome Sequencing" },
    "HLA": { short: "HLA", full: "Human Leukocyte Antigen" },
    "WES + Mito": { short: "WES + Mito", full: "Whole Exome Sequencing + Mitochondrial" },
    "CES + Mito": { short: "CES + Mito", full: "Clinical Exome Sequencing + Mitochondrial" },
  };

  let rows = [];

  const [filters, setFilters] = useState({
    sample_id: "",
    sample_status: "",
    sample_indicator: "",
    from_date: "",
    to_date: "",
    doctor_name: "",
    dept_name: "",
    run_id: "",
    selectedTestNames: [],
  });
  const [tableRows, setTableRows] = useState(rows);
  const [selectedTestNames, setSelectedTestNames] = useState([]);
  const [selectedSampleIndicator, setSelectedSampleIndicator] = useState('');
  const [columnSearch, setColumnSearch] = useState("")
  const [sorting, setSorting] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [rowSelection, setRowSelection] = useState(() => {
    const selectedIds = JSON.parse(localStorage.getItem("selectedLibraryPrepSamples") || "[]");
    return {};
  });
  const dispatch = useDispatch();

  const handleEditRow = (rowData) => {
    // Save the row data to localStorage or Redux for use in the SampleRegistration tab
    // console.log('rowData:', rowData); // Debugging row data
    localStorage.setItem("editRowData", JSON.stringify(rowData));

    // Navigate to the SampleRegistration tab
    dispatch(setActiveTab("sample-register"));
  };

  const isPrivilegedUser = user?.role === "AdminUser" || user?.role === "SuperAdmin";

  const columns = React.useMemo(() => [

    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={value => {
            // Only select rows that are eligible for Library Preparation
            table.getRowModel().rows.forEach(row => {
              const rowData = row.original;
              if (rowData.lib_prep === "Yes" && rowData.under_seq === "No") {
                const disabled = rowData.specimen_quality === 'Not Accepted' || rowData.dna_isolation !== "Yes";
                if (!disabled) {
                  row.toggleSelected(!!value);
                }
              }
            });
            // After toggling, collect all selected internal_ids and store in localStorage
            // Use a timeout to ensure selection state is updated
            setTimeout(() => {
              const selectedIds = table.getSelectedRowModel().rows.map(r => r.original.internal_id);
              localStorage.setItem("selectedLibraryPrepSamples", JSON.stringify(selectedIds));
            }, 0);
          }}
          className="border border-orange-400"
        />
      ),
      cell: ({ row }) => {
        const rowData = row.original;
        const disabled =
          rowData.specimen_quality === 'Not Accepted' ||
          rowData.dna_isolation !== "Yes" ||
          rowData.seq_completed === "Yes";
        return disabled
          ? (
            <Checkbox
              checked={false}
              disabled={true}
              className="border border-orange-400"
            />
          )
          : (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => {
                // 1. Only dna_isolation is Yes
                const onlyDnaIsolation =
                  rowData.dna_isolation === "Yes" &&
                  rowData.lib_prep === "No" &&
                  rowData.under_seq === "No" &&
                  rowData.seq_completed === "No";

                // 2. under_seq is Yes and seq_completed is No
                const underSeqYesSeqCompletedNo =
                  rowData.under_seq === "Yes" && rowData.seq_completed === "No";

                if (value && (onlyDnaIsolation || underSeqYesSeqCompletedNo)) {
                  setRepeatRow(rowData);
                  setShowRepeatDialog(true);
                  return;
                }
                row.toggleSelected(!!value);

                // Update localStorage after toggling
                setTimeout(() => {
                  const selectedIds = table.getSelectedRowModel().rows.map(r => r.original.internal_id);
                  localStorage.setItem("selectedLibraryPrepSamples", JSON.stringify(selectedIds));
                }, 0);
              }}
              className="border border-orange-400"
            />
          );
      },
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "id",
      header: "S. No.",
      cell: ({ row }) => row.index + 1,
      // enableSorting: true,
      enableHiding: false,
    },


    ...allColumns.map((col) => {

      if (col.key === "internal_id") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const row = info.row.original;
            return row.base_internal_id ? row.base_internal_id : row.internal_id || "";
          },
        };
      }

      if (col.key === "total_gb_available" || col.key === "total_required") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const value = info.getValue();
            if (value === null || value === undefined || value === "") return "";
            else return parseFloat(value).toFixed(2);
          },
        }
      }

      if (col.key === "nm_cal") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const value = info.getValue();
            if (value === null || value === undefined || value === "") return "";
            else return parseFloat(value).toFixed(2);
          },
        }
      }

      if (col.key === "registration_date" || col.key === "sample_date" || col.key === "repeat_date" || col.key === "seq_run_date" || col.key === "report_releasing_date" || col.key === "lib_prep_date" || col.key === "collection_date_time") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const value = info.getValue();
            if (!value) return "";
            const date = new Date(value);
            if (isNaN(date)) return value;
            // Format: YYYY-MM-DD HH:mm
            const formattedDate = new Date(value).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }); // Format as dd-mm-yyyy
            return <span>{formattedDate}</span> || "";
          },
        };
      }
      if (["hpo_id", "hpo_term", "clinical_history", "remarks"].includes(col.key)) {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          size: 140, // Set your desired width in px
          cell: (info) => (
            <div style={{
              maxWidth: 140,
              minWidth: 140,
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}>
              {info.getValue() || ""}
            </div>
          ),
        };
      }

      if (col.key === 'sample_id') {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const row = info.row.original
            return (
              <button
                className="cursor-pointer"
                onClick={() => handleShowAudit(row.sample_id, row.internal_id)}
              >
                <abbr className="underline [text-decoration-style:solid]" title="Click to display the Comments & History">{row.sample_id}</abbr>
              </button>
            );
          },
        };
      }
      if (["dna_isolation", "lib_prep", "under_seq", "seq_completed"].includes(col.key)) {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const rowIdx = info.row.index;
            const rowData = info.row.original;
            const indicators = [
              rowData.dna_isolation === "Yes",
              rowData.lib_prep === "Yes",
              rowData.under_seq === "Yes",
              rowData.seq_completed === "Yes"
            ];
            const indicatorKeys = ["dna_isolation", "lib_prep", "under_seq", "seq_completed"];
            const idx = indicatorKeys.indexOf(col.key);

            // If seq_completed is checked, disable all
            if (rowData.seq_completed === "Yes") {
              return (
                <Checkbox
                  checked={rowData[col.key] === "Yes"}
                  className="border border-orange-400"
                  disabled={true}
                />
              );
            }

            // If any later indicator is checked, disable previous ones
            const laterChecked = indicators.slice(idx + 1).some(Boolean);
            if (laterChecked) {
              return (
                <Checkbox
                  checked={rowData[col.key] === "Yes"}
                  className="border border-orange-400"
                  disabled={true}
                />
              );
            }

            // Enable only if previous is checked (except for the first)
            let disabled = false;
            if (idx > 0 && !indicators[idx - 1]) {
              disabled = true;
            }

            return (
              <Checkbox
                checked={rowData[col.key] === "Yes"}
                className="border border-orange-400"
                disabled={disabled}
                onCheckedChange={async (checked) => {
                  if (disabled) return;
                  const updatedRow = {
                    ...rowData,
                    [col.key]: checked ? "Yes" : "No",
                  };
                  setTableRows((prev) =>
                    prev.map((row, i) => (i === rowIdx ? updatedRow : row))
                  );
                  const payload = {
                    sample_id: updatedRow.sample_id,
                    internal_id: updatedRow.internal_id,
                    sample_indicator: col.key,
                    indicator_status: checked ? "Yes" : "No",
                    changed_by: user.email,
                    hospital_name: user.hospital_name
                  };
                  try {
                    const response = await axios.put("/api/pool-data", { data: payload });
                    if (response.data[0].status === 200) {
                      const updatedRows = tableRows.map((row, i) =>
                        i === rowIdx ? { ...row, [col.key]: checked ? "Yes" : "No" } : row
                      );
                      setTableRows(updatedRows);
                      localStorage.setItem("searchData", JSON.stringify(updatedRows));
                    } else {
                      toast.error(response.data[0].message || "Failed to update sample indicator.");
                    }
                  } catch (error) {
                    console.error("Error updating sample indicator:", error);
                    toast.error("An error occurred while updating the sample indicator.");
                  }
                }}
              />
            );
          },
        };
      }
      if (col.key === "trf") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const value = info.getValue();
            if (!value) return "";
            // console.log('value:', value); // Debugging TRF value
            return (
              <a className="underline text-blue-500" href={`https://drive.google.com/file/d/${value}/view?usp=sharing`} target="_blank" rel="noopener noreferrer">
                View TRF
              </a>
            );
          },
        };
      }
      if (col.key === "report_link" || col.key === "mito_report_link") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const value = info.getValue();
            if (!value) return "";
            return (
              <a className="underline text-blue-500" href={value} target="_blank" rel="noopener noreferrer">
                View Report
              </a>
            );
          },
        };
      }
      if (col.key === "test_name") {
        return {
          accessorKey: col.key,
          header: col.label,
          enableSorting: true,
          cell: (info) => {
            const value = info.getValue();
            const mapping = testNameShortMap[value];
            if (mapping) {
              return (
                <abbr title={mapping.full} style={{ textDecoration: "none", cursor: "pointer" }}>
                  {mapping.short}
                </abbr>
              );
            }
            // fallback: show value as is
            return value;
          },
        };
      }
      return {
        accessorKey: col.key,
        header: col.label,
        enableSorting: true,
        cell: (info) => info.getValue() || "",
      };
    }),


    ...(isPrivilegedUser ? [{
      accessorKey: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original;
        return (
          <Button
            variant="outline"
            className="text-sm cursor-pointer text-black dark:text-white"
            onClick={() => handleEditRow(rowData)}
          >
            Edit
          </Button>
        );
      },
    }] : []),

  ], [allColumns, user, tableRows]);

  const defaultVisible = [
    "id",
    "sample_id",
    "internal_id",
    "registration_date",
    "test_name",
    "patient_name",
    "dna_isolation",
    "lib_prep",
    "under_seq",
    "seq_completed",
    ...(isPrivilegedUser ? ["actions"] : []), // Only show actions for privileged users
  ];

  // Set initial column visibility: true for defaultVisible, false for others
  const [columnVisibility, setColumnVisibility] = useState(() =>
    columns.reduce((acc, col) => {
      acc[col.accessorKey] = defaultVisible.includes(col.accessorKey);
      return acc;
    }, {})
  );

  const table = useReactTable({
    data: tableRows,
    columns,
    rowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setTableRows(prev =>
          prev.map((row, idx) => {
            if (idx !== rowIndex) return row;
            return { ...row, [columnId]: value };
          })
        );
      },
    },
  });

  useEffect(() => {
    // Load saved data from localStorage if available
    const savedData = localStorage.getItem("searchData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Map the data to ensure checkbox fields are "Yes"/"No"
      const mappedData = parsedData
        // .filter(row => row.is_repeated !== "True")
        .map((row) => ({
          ...row,
          dna_isolation: row.dna_isolation === "Yes" ? "Yes" : "No",
          lib_prep: row.lib_prep === "Yes" ? "Yes" : "No",
          under_seq: row.under_seq === "Yes" ? "Yes" : "No",
          seq_completed: row.seq_completed === "Yes" ? "Yes" : "No",
        }));

      const latestRows = Object.values(
        mappedData.reduce((acc, row) => {
          const key = row.internal_id;
          if (
            !acc[key] ||
            new Date(row.registration_date) > new Date(acc[key].registration_date) ||
            row.is_repeated === 'True'
          ) {
            acc[key] = row;
          }
          return acc;
        }, {})
      );
      const sortedRows = latestRows.sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date));
      setTableRows(sortedRows);
      localStorage.setItem("searchData", JSON.stringify(sortedRows));
    }
  }, []);

  // Fetch test names from API (like SampleRegistration)
  useEffect(() => {
    const fetchTestNames = async () => {
      const user = JSON.parse(Cookies.get('vide_user') || "{}");
      const hospitalName = user?.hospital_name || 'default';
      try {
        const res = await axios.get(`/api/default-values?hospital_name=${encodeURIComponent(hospitalName)}&type=test_name`);
        setAllTests(res.data[0]?.values || []);
      } catch (e) {
        setAllTests([]);
      }
    };
    fetchTestNames();
  }, []);

  useEffect(() => {
    const selectedIds = JSON.parse(localStorage.getItem("selectedLibraryPrepSamples") || "[]");
    // Find row indices for selected internal_ids
    const selection = {};
    tableRows.forEach((row, idx) => {
      if (selectedIds.includes(row.internal_id)) {
        selection[idx] = true;
      }
    });
    setRowSelection(selection);
  }, [tableRows]);

  const handlesubmit = async () => {
    setProcessing(true);
    const getValue = (name) => document.getElementsByName(name)[0]?.value || "";

    const data = {
      sample_id: filters.sample_id,
      test_name: filters.selectedTestNames.join(","),
      sample_status: filters.sample_status,
      sample_indicator: filters.sample_indicator,
      from_date: filters.from_date,
      to_date: filters.to_date,
      doctor_name: filters.doctor_name,
      dept_name: filters.dept_name,
      run_id: filters.run_id,
      for: 'process'
    };
    // if (user && user.role !== "SuperAdmin") {
    data.hospital_name = user.hospital_name; // Add hospital_name from user data
    // }

    try {
      const response = await axios.get(`/api/search`, { params: data });
      // console.log('response.data:', response.data[0].data); // Debugging response data

      if (response.data[0].status === 200) {
        // Map the data to ensure checkbox fields are "Yes"/"No"
        const mappedData = response.data[0].data
          .map((row) => ({
            ...row,
            dna_isolation: row.dna_isolation === "Yes" ? "Yes" : "No",
            lib_prep: row.lib_prep === "Yes" ? "Yes" : "No",
            under_seq: row.under_seq === "Yes" ? "Yes" : "No",
            seq_completed: row.seq_completed === "Yes" ? "Yes" : "No",
          }));

        // Deduplicate: keep only the latest occurrence (repeat if exists)
        const latestRows = Object.values(
          mappedData.reduce((acc, row) => {
            const key = row.internal_id;
            if (
              !acc[key] ||
              new Date(row.registration_date) > new Date(acc[key].registration_date) ||
              row.is_repeated === 'True'
            ) {
              acc[key] = row;
            }
            return acc;
          }, {})
        );
        setProcessing(false);
        const sortedRows = latestRows.sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date));
        setTableRows(sortedRows); // Update the tableRows state with the mapped data
        localStorage.setItem("searchData", JSON.stringify(sortedRows)); // Save to localStorage
      } else if (response.data[0].status === 400 || response.data[0].status === 404) {
        toast.error(response.data[0].message || "No data found for the given filters.");
        setProcessing(false);
        setTableRows([]);
      }
    } catch (error) {
      if (error.response) {
        setTableRows([]);
        setProcessing(false);
        toast.error(error.response.data.message || "An error occurred while fetching the data.");
      }
      console.error("Error fetching data:", error);
    }

  };

  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);

  const pooledColumns = [
    "pool_no",
    "batch_id",
    "pool_conc",
    "size",
    "nm_conc",
    "one_tenth_of_nm_conc",
    "total_vol_for_20nm",
    "lib_vol_for_20nm",
    "nfw_volu_for_20nm",
    "vol_for_40nm_percent_pooling",
    "volume_from_40nm_for_total_25ul_pool",
  ];

  const handleSendForLibraryPreparation = async () => {
    setSendSamplesProcessing(true);
    const validRows = selectedRows.filter(row => row.specimen_quality !== 'Not Accepted');
    if (validRows.length === 0) {
      toast.warning("No rows selected for Library Preparation.");
      setSendSamplesProcessing(false);
      return;
    }

    for (const row of validRows) {
      try {
        const auditLog = {
          sample_id: row.sample_id,
          changed_by: user.email,
          comments: `Sample moved to Library Preparation`,
          changed_at: new Date().toISOString()
        };
        await axios.put("/api/store", {
          internal_id: row.internal_id,
          updates: { location: "lib_prep" },
          auditLog
        });
      } catch (err) {
        setSendSamplesProcessing(false);
      }
    }

    // Group new rows by main test name (strip " + Mito" if present)
    const newGroupedData = validRows.reduce((acc, row) => {
      // Extract main test name (before " + Mito")
      const mainTestName = row.test_name.includes(" + Mito")
        ? row.test_name.split(" + Mito")[0].trim()
        : row.test_name;
      if (!acc[mainTestName]) acc[mainTestName] = [];
      acc[mainTestName].push(row);
      return acc;
    }, {});

    // Fetch existing data from localStorage and merge
    const existingData = JSON.parse(localStorage.getItem("libraryPreparationData") || "{}");
    const mergedData = { ...existingData };

    Object.keys(newGroupedData).forEach(testName => {
      // If already in new format, merge into .rows, else upgrade old array to new format
      if (!mergedData[testName]) {
        mergedData[testName] = { rows: [], pools: [] };
      } else if (Array.isArray(mergedData[testName])) {
        mergedData[testName] = { rows: mergedData[testName], pools: [] };
      }
      // Prevent duplicate sample_ids
      const existingIds = new Set((mergedData[testName].rows || []).map(r => r.sample_id));
      newGroupedData[testName].forEach(row => {
        if (!existingIds.has(row.sample_id)) {
          mergedData[testName].rows.push(row);
        }
      });

      // --- NEW LOGIC: Group pooled data by pool_no ---
      const rows = mergedData[testName].rows || [];
      const poolsMap = {};

      rows.forEach((row, idx) => {
        const poolNo = row.pool_no;
        if (!poolNo) return;
        if (!poolsMap[poolNo]) {
          poolsMap[poolNo] = {
            sampleIndexes: [],
            sampleInternalIds: [], // <-- ADD THIS LINE
            values: {},
          };
        }
        poolsMap[poolNo].sampleIndexes.push(idx);
        poolsMap[poolNo].sampleInternalIds.push(row.internal_id); // <-- ADD THIS LINE
        pooledColumns.forEach(col => {
          if (row[col] !== undefined && row[col] !== null && row[col] !== "") {
            poolsMap[poolNo].values[col] = row[col];
          }
        });
      });

      // Convert poolsMap to array
      const poolRows = Object.values(poolsMap);

      // Only add if there is pooled data
      if (poolRows.length > 0) {
        mergedData[testName].pools = poolRows;
      }
      // --- END NEW LOGIC ---
    });

    // Save back to localStorage
    localStorage.setItem("libraryPreparationData", JSON.stringify(mergedData));

    // Navigate
    dispatch(setActiveTab("library-prepration"));
    setProcessing(false);
  };

  const handleSaveToExcel = async () => {
    try {
      // Get visible columns
      const visibleColumns = Object.keys(table.getState().columnVisibility).filter(
        (key) => table.getState().columnVisibility[key]
      );

      // Filter tableRows to include only visible columns
      const filteredData = tableRows.map((row) => {
        const filteredRow = {};
        visibleColumns.forEach((key) => {
          filteredRow[key] = row[key];
        });
        return filteredRow;
      });

      // Send filtered data to the API
      const response = await axios.post(
        '/api/convert-to-excel',
        { data: filteredData },
        { responseType: 'blob' }
      );

      // Create a URL for the file and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_data.xlsx'); // Set the file name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('An error occurred while saving the data.');
    }
  };

  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem("processingFilters") || "{}");
    setFilters({
      sample_id: savedFilters.sample_id || "",
      sample_status: savedFilters.sample_status || "",
      sample_indicator: savedFilters.sample_indicator || "",
      from_date: savedFilters.from_date || "",
      to_date: savedFilters.to_date || "",
      doctor_name: savedFilters.doctor_name || "",
      dept_name: savedFilters.dept_name || "",
      run_id: savedFilters.run_id || "",
      selectedTestNames: savedFilters.selectedTestNames || [],
    });
    setSelectedTestNames(savedFilters.selectedTestNames || []);
  }, []);

  const handleFilterChange = (name, value) => {
    const updated = { ...filters, [name]: value };
    setFilters(updated);
    localStorage.setItem("processingFilters", JSON.stringify(updated));
    if (name === "selectedTestNames") setSelectedTestNames(value);
  };

  useEffect(() => {
    const fetchInUseEffect = async () => {
      // setProcessing(true);
      const filters = JSON.parse(localStorage.getItem("processingFilters") || "{}");
      const data = {
        sample_id: filters.sample_id,
        test_name: (filters.selectedTestNames || []).join(","),
        sample_status: filters.sample_status,
        sample_indicator: filters.sample_indicator,
        from_date: filters.from_date,
        to_date: filters.to_date,
        doctor_name: filters.doctor_name,
        dept_name: filters.dept_name,
        run_id: filters.run_id,
        for: 'process',
      };
      if (user && user.role !== "SuperAdmin") {
        data.hospital_name = user.hospital_name; // Add hospital_name from user data
      }

      const filterFields = [
        data.sample_id || "",
        data.test_name || "",
        data.sample_status || "",
        data.sample_indicator || "",
        data.from_date || "",
        data.to_date || "",
        data.doctor_name || "",
        data.dept_name || "",
        data.run_id || "",
      ];

      const allEmpty = filterFields.every(val => val === "");
      if (!allEmpty) {
        try {
          const response = await axios.get(`/api/search`, { params: data });

          if (response.data[0].status === 200) {
            // Map the data to ensure checkbox fields are "Yes"/"No"
            const mappedData = response.data[0].data
              .map((row) => ({
                ...row,
                dna_isolation: row.dna_isolation === "Yes" ? "Yes" : "No",
                lib_prep: row.lib_prep === "Yes" ? "Yes" : "No",
                under_seq: row.under_seq === "Yes" ? "Yes" : "No",
                seq_completed: row.seq_completed === "Yes" ? "Yes" : "No",
              }));

            // Deduplicate: keep only the latest occurrence (repeat if exists)
            const latestRows = Object.values(
              mappedData.reduce((acc, row) => {
                const key = row.internal_id;
                if (
                  !acc[key] ||
                  new Date(row.registration_date) > new Date(acc[key].registration_date) ||
                  row.is_repeated === 'True'
                ) {
                  acc[key] = row;
                }
                return acc;
              }, {})
            );
            setProcessing(false);
            // console.log('mappedData:', mappedData); // Debugging mapped data
            const sortedRows = latestRows.sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date));
            setTableRows(sortedRows); // Update the tableRows state with the mapped data
            localStorage.setItem("searchData", JSON.stringify(sortedRows)); // Save to localStorage
          } else if (response.data[0].status === 400 || response.data[0].status === 404) {
            setProcessing(false);
            setTableRows([]);
          }
        } catch (error) {
          if (error.response) {
            setTableRows([]);
            setProcessing(false);
          }
          console.error("Error fetching data:", error);
        }

      }
    }
    fetchInUseEffect();
  }, [])

  const handleShowAudit = async (sampleId, internalId) => {
    setAuditSampleId(sampleId);
    setShowAuditSidebar(true);
    try {
      const res = await axios.get(`/api/audit-logs?sample_id=${sampleId}&internal_id=${internalId}&hospital_name=${encodeURIComponent(user.hospital_name)}`);
      console.log('res.data:', res.data); // Debugging audit data
      setAuditData(res.data[0]?.logs || []);
    } catch (e) {
      setAuditData([]);
      toast.error("Failed to fetch audit data.");
    }
  };


  useEffect(() => {
    setColumnVisibility(prev => {
      const updated = { ...prev };
      if (!filters.sample_indicator) {
        // Show all indicator columns if none selected
        indicatorKeys.forEach(key => {
          updated[key] = true;
        });
      } else {
        // Show only the selected indicator column
        indicatorKeys.forEach(key => {
          updated[key] = key === filters.sample_indicator;
        });
      }
      return updated;
    });
  }, [filters.sample_indicator]);

  return (
    <div className="p-4">


      {/* Top Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 items-end ">

          <div>
            <label className="block font-semibold mb-1">Sample id</label>
            <Input
              name='sample_id'
              placeholder="Sample id"
              value={filters.sample_id}
              onChange={(e) => handleFilterChange('sample_id', e.target.value)}
              className="w-full border-2 border-orange-300"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 whitespace-nowrap">Test name</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  className="h-10 bg-gray-700 hover:bg-gray-800 cursor-pointer text-white w-full"
                >
                  Add Test
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[250px]">
                {/* Select All Option */}
                <DropdownMenuItem
                  onSelect={e => e.preventDefault()}
                  onClick={() => {
                    handleFilterChange('selectedTestNames', allTests);
                  }}
                  disabled={selectedTestNames.length === allTests.length}
                >
                  <span className="text-sm font-semibold">Select All</span>
                </DropdownMenuItem>
                {/* Deselect All Option */}
                <DropdownMenuItem
                  onSelect={e => e.preventDefault()}
                  onClick={() => {
                    handleFilterChange('selectedTestNames', []);
                  }}
                  disabled={selectedTestNames.length === 0}
                >
                  <span className="text-sm font-semibold">Deselect All</span>
                </DropdownMenuItem>
                {/* Divider */}
                <div className="border-b border-gray-200 my-1" />
                {/* Individual Test Options */}
                {allTests
                  .filter(test => !selectedTestNames.includes(test))
                  .map(test => (
                    <DropdownMenuItem
                      key={test}
                      onSelect={e => e.preventDefault()} // <-- Add this line
                      onClick={() => {
                        if (selectedTestNames.includes(test)) return;
                        const updated = [...filters.selectedTestNames, test];
                        handleFilterChange('selectedTestNames', updated);
                      }}
                    >
                      <span className="text-sm">{test}</span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className="block font-semibold mb-1">Selected Test Name</label>
            <div className="flex border-2 border-orange-300 flex-wrap gap-2 rounded-md p-2 dark:bg-gray-800 min-h-[42px] w-full overflow-y-auto max-h-20">
              {selectedTestNames.length === 0 && (
                <span className="text-gray-400 dark:text-white">No test added</span>
              )}
              {selectedTestNames.map((test, idx) => (
                <span
                  key={test}
                  className="flex items-center bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-semibold"
                >
                  {test}
                  <button
                    type="button"
                    className="ml-2 text-orange-700 hover:text-red-600 focus:outline-none"
                    onClick={() => {
                      const updated = filters.selectedTestNames.filter(t => t !== test);
                      handleFilterChange('selectedTestNames', updated);
                    }}
                    aria-label={`Remove ${test}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Sample Status</label>
            <select
              name='sample_status'
              value={filters.sample_status}
              onChange={(e) => handleFilterChange('sample_status', e.target.value)}
              className="w-full border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800"
            >
              <option value="">Select Sample Status</option>
              <option value="processing">Under Processing</option>
              <option value="reporting">Ready for Reporting</option>
              <option value='Not Accepted'>Rejected</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Sample Indicator</label>
            <select
              name='sample_indicator'
              className="w-full border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800"
              value={filters.sample_indicator}
              onChange={e => handleFilterChange('sample_indicator', e.target.value)}
            >
              <option value="">Select the Sample Indicator</option>
              <option value="dna_isolation">DNA Isolation</option>
              <option value="lib_prep">Library Prep</option>
              <option value="under_seq">Under sequencing</option>
              <option value="seq_completed">Sequencing completed</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">From Date</label>
            <Input
              name='from_date'
              type="date"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800 w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">To Date</label>
            <Input
              name='to_date'
              type="date"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800 w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Doctor's Name</label>
            <Input
              name='doctor_name'
              placeholder="Doctor's Name"
              value={filters.doctor_name}
              onChange={(e) => handleFilterChange('doctor_name', e.target.value)}
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800 w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Dept. Name</label>
            <Input
              name='dept_name'
              placeholder="Dept. Name"
              value={filters.dept_name}
              onChange={(e) => handleFilterChange('dept_name', e.target.value)}
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800 w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Run id</label>
            <Input
              name='run_id'
              placeholder="Run id"
              value={filters.run_id}
              onChange={(e) => handleFilterChange('run_id', e.target.value)}
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800 w-full"
            />
          </div>
          <div className="col-span-full">
            <Button
              type='submit'
              onClick={() => { handlesubmit() }}
              disabled={processing}
              className="w-[240px] mt-[20px] bg-gray-700 hover:bg-gray-800 text-white cursor-pointer"
            >
              {processing ? 'Retrieving...' : 'Retrieve'}
            </Button>
          </div>
        </div>
      </div>

      {tableRows && tableRows.length > 0 && (
        <>
          {/* Column Selector Dropdown */}
          <div className="mb-4 flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px]">
                  Select Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-72 overflow-y-auto w-64">
                {/* Always visible search bar */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-2 py-2">
                  <Input
                    type="text"
                    placeholder="Search columns..."
                    value={columnSearch}
                    onChange={e => setColumnSearch(e.target.value)}
                    className="w-full border border-orange-300 rounded-md"
                    onPointerDown={e => e.stopPropagation()} // Prevent dropdown from closing on mouse
                    onKeyDown={e => e.stopPropagation()}     // Prevent dropdown from closing on keyboard
                  />
                </div>
                {/* Only show checkboxes for columns that match the search */}
                <DropdownMenuCheckboxItem
                  onSelect={(e) => e.preventDefault()}
                  checked={Object.values(table.getState().columnVisibility).every(Boolean)}
                  onCheckedChange={value =>
                    table.getAllLeafColumns()
                      .filter(column => {
                        const header = column.columnDef.header;
                        const headerText = typeof header === "string" ? header : column.id;
                        return headerText.toLowerCase().includes(columnSearch.toLowerCase());
                      })
                      .forEach(column => column.toggleVisibility(!!value))
                  }
                >
                  Select All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => {
                    table.getAllLeafColumns()
                      .filter(column => {
                        const header = column.columnDef.header;
                        const headerText = typeof header === "string" ? header : column.id;
                        return headerText.toLowerCase().includes(columnSearch.toLowerCase());
                      })
                      .forEach(column => {
                        column.toggleVisibility(defaultVisible.includes(column.id));
                      });
                  }}
                >
                  Deselect All
                </DropdownMenuCheckboxItem>
                {table
                  .getAllLeafColumns()
                  .slice()
                  .sort((a, b) => a.columnDef.header.localeCompare(b.columnDef.header))
                  .filter(column => column.getCanHide())
                  .filter(column =>
                    column.columnDef.header
                      .toLowerCase()
                      .includes(columnSearch.toLowerCase())
                  )
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      onSelect={(e) => e.preventDefault()}
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={value => column.toggleVisibility(!!value)}
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

          {/* Table */}
          <div className="">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-6 overflow-x-auto w-full whitespace-nowrap"
              style={{ maxWidth: 'calc(100vw - 60px)' }}
            >
              <div className="max-h-[70vh] overflow-y-auto w-full">
                <table className="min-w-full border-collapse table-auto">
                  <thead className="bg-orange-100 dark:bg-gray-800 sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className="cursor-pointer px-4 py-2 text-center border-b border-gray-200 bg-orange-100 dark:bg-gray-800 sticky top-0 z-20"
                            style={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              maxWidth: "180px", // adjust as needed
                              minWidth: "80px",
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row, idx) => {
                        const isRejected = row.original.specimen_quality === 'Not Accepted';
                        const isLibraryPrep = row.original.lib_prep === 'Yes';
                        const indicatorKeys = ["dna_isolation", "lib_prep", "under_seq", "seq_completed"];
                        const indicatorIndexes = row.getVisibleCells()
                          .map((cell, cellIdx) => indicatorKeys.includes(cell.column.id) ? cellIdx : -1)
                          .filter(cellIdx => cellIdx !== -1);

                        {/* const isMoved = row.original.location && row.original.location !== "monitering"; */ }

                        return (
                          <tr
                            key={idx}
                            className={
                              (row.original.prority === 'urgent' ? 'bg-orange-600 ' : '') +
                              (row.original.is_repeated === 'True'
                                ? 'bg-gray-500 '
                                : row.original.location && row.original.seq_completed === 'Yes'
                                  ? 'bg-gray-300 dark:text-black '
                                  : '')
                            }
                          >
                            {row.getVisibleCells().map((cell, cellIdx) => {
                              // If this is the first indicator column and rejected, show REJECTED with colspan
                              if (
                                isRejected &&
                                indicatorIndexes.length > 0 &&
                                cellIdx === indicatorIndexes[0]
                              ) {
                                return (
                                  <td
                                    key={cell.id + '-rejected'}
                                    colSpan={indicatorIndexes.length}
                                    className="px-4 py-2 border-b border-gray-100 text-center text-red-500 font-semibold"
                                  >
                                    REJECTED
                                  </td>
                                );
                              }
                              // Skip rendering the other indicator columns if rejected
                              if (
                                isRejected &&
                                indicatorIndexes.length > 0 &&
                                indicatorIndexes.includes(cellIdx) &&
                                cellIdx !== indicatorIndexes[0]
                              ) {
                                return null;
                              }
                              // Normal rendering
                              return (
                                <td key={cell.id + '-' + idx + '-' + cellIdx} className="px-4 py-2 border-b border-gray-100 text-center">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-4 text-gray-400">
                          No data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>


          </div>
          <div className="flex justify-between items-center mb-4">
            <Button
              className="bg-gray-700 hover:bg-gray-800 mt-5 text-white cursor-pointer min-w-[120px] h-12"
              onClick={handleSaveToExcel}
            >
              Save to excel
            </Button>

            {selectedRows && (
              <Button
                disabled={sendSamplesProcessing}
                className={"mt-5 text-white cursor-pointer min-w-[200px] h-12 bg-gray-700 hover:bg-gray-800 " + (selectedRows ? "" : "opacity-50")}
                onClick={handleSendForLibraryPreparation}
              >
                {sendSamplesProcessing ? 'Sending...' : 'Send for Library Preparation'}
              </Button>
            )}

          </div>
        </>
      )
      }
      <AuditSidebar
        open={showAuditSidebar}
        onClose={() => setShowAuditSidebar(false)}
        sampleId={auditSampleId}
        audits={auditData}
        changed_by={user.email}
        setAuditData={setAuditData}
        hospitalName={user.hospital_name}
      />

      <DialogBox
        isOpen={showRepeatDialog}
        onClose={() => setShowRepeatDialog(false)}
        sample_id={repeatRow?.sample_id}
        internal_id={repeatRow?.internal_id}
        user_email={user.email}
      />
      <ToastContainer />

    </div >
  );
};

export default Processing;

const AuditSidebar = ({ open, onClose, sampleId, audits, changed_by, setAuditData, hospitalName }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);


  if (!open) return null;

  const HandleAddComment = async (value) => {
    try {
      const data = {
        sample_id: sampleId,
        comments: value,
        changed_by: changed_by,
        changed_at: new Date().toISOString(),
        hospital_name: hospitalName
      }
      const res = await axios.post('/api/audit-logs', data)
      if (res.data[0].status === 201) {
        const data = await axios.get(`/api/audit-logs?sample_id=${sampleId}&hospital_name=${encodeURIComponent(hospitalName)}`);
        if (data.data[0].status === 200) {
          // toast.success("Comment added successfully.");
          setAuditData(data.data[0].logs || []);
        }
      }
      else if (res.data[0].status === 400) {
        toast.error(res.data[0].message || "Failed to add comments.");
      }
    }
    catch (e) {
      console.log('error:', e);
    }
  }
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.2)" }}
        onClick={onClose}
      />
      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-gray-900 shadow-lg z-50 transition-transform"
        style={{ transition: "transform 0.3s", transform: open ? "translateX(0)" : "translateX(100%)" }}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside sidebar
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg text-orange-400">Comments & History: {sampleId}</h2>
          <Button variant="outline" className='text-red-500' onClick={onClose}>X</Button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <input
            type="text"
            className="w-full mb-4 p-2 border-2 border-orange-200 rounded-md"
            placeholder="Add Comment..."
          />
          <Button
            className='bg-orange-400 text-white mb-3 hover:bg-orange-400 cursor-pointer'
            onClick={(e) => HandleAddComment(e.target.previousElementSibling.value)}
          >
            Add Comment
          </Button>
          {audits.length === 0 ? (
            <div className="text-gray-500">No audit data found.</div>
          ) : (
            <ul className="space-y-3">
              {audits.map((audit, idx) => (
                <li key={idx} className="border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="">{audit.changed_by}</div>
                    <div className="">
                      {new Date(audit.changed_at).toLocaleString("en-GB", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {audit.changes && audit.changes.map((change, changeIdx) => (
                    <div key={changeIdx} className="mt-1">
                      <span className="font-semibold">{change.field}:</span> {change.oldValue} → {change.newValue}
                    </div>
                  ))}
                  {audit.comments !== null && (
                    <div className="mt-1">
                      <span className="font-semibold">Comment:</span> {audit.comments}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

const DialogBox = ({ isOpen, onClose, sample_id, user_email, internal_id }) => {
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
      const res = await axios.post('/api/repeat-sample', {
        repeat_type: type,
        comments: comments,
        sample_id: sample_id,
        user_email: user_email,
      });
      if (res.data[0].status === 200) {
        toast.success("Repeat sample created successfully!");
        const row = res.data[0].data;

        // Insert the new row into localStorage under the correct test_name
        const libraryData = JSON.parse(localStorage.getItem("libraryPreparationData") || "{}");
        const testName = row.test_name?.includes(" + Mito")
          ? row.test_name.split(" + Mito")[0].trim()
          : row.test_name;

        if (!libraryData[testName]) {
          libraryData[testName] = { rows: [], pools: [] };
        } else if (Array.isArray(libraryData[testName])) {
          libraryData[testName] = { rows: libraryData[testName], pools: [] };
        }

        // Prevent duplicate sample_ids
        const exists = (libraryData[testName].rows || []).some(r => r.internal_id === row.internal_id);
        if (!exists) {
          libraryData[testName].rows.push(row);
        }

        localStorage.setItem("libraryPreparationData", JSON.stringify(libraryData));

        await axios.put("/api/store", {
          internal_id: internal_id,
          updates: { is_repeated: "True" },
        });

        const filters = JSON.parse(localStorage.getItem("processingFilters") || "{}");
        const data = {
          sample_id: filters.sample_id,
          test_name: (filters.selectedTestNames || []).join(","),
          sample_status: filters.sample_status,
          sample_indicator: filters.sample_indicator,
          from_date: filters.from_date,
          to_date: filters.to_date,
          doctor_name: filters.doctor_name,
          dept_name: filters.dept_name,
          run_id: filters.run_id,
          for: 'process',
        };

        // Optionally add hospital_name if needed
        if (user_email && window?.user?.role !== "SuperAdmin") {
          data.hospital_name = window?.user?.hospital_name;
        }

        // Call the search API
        const response = await axios.get(`/api/search`, { params: data });
        if (response.data[0].status === 200) {
          // Filter out the repeated sample by internal_id
          const filteredRows = response.data[0].data.filter(row => row.internal_id !== internal_id);
          // Update the tableRows in parent (you may need to pass setTableRows as a prop or use a context)
          if (typeof window.setTableRows === "function") {
            window.setTableRows(filteredRows);
          }
        }
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
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Repeat Sample?</DialogTitle>
        </DialogHeader>
        <div>
          <span className="font-bold">Do you want to repeat this sample?</span>
          <div className="flex gap-2 justify-start mt-2">
            <select
              className="border-2 border-orange-300 rounded-md p-2 dark:bg-gray-800"
              name='repeat_type'
              defaultValue=""
            >
              <option value="">Select</option>
              <option value="repeat_from_sequencing">Repeat From Sequencing</option>
              <option value="repeat_from_extraction">Repeat From Extraction</option>
            </select>
            <div>
              <input
                type='text'
                name='comments'
                placeholder='Enter reason for repeat'
                className="border-2 border-orange-300 rounded-md p-2"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className='bg-green-400 text-white hover:bg-green-500 cursor-pointer'
            onClick={() => handleRepeat(document.querySelector('select[name="repeat_type"]').value, document.querySelector('input[name="comments"]').value)}
          >
            Repeat
          </Button>
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

