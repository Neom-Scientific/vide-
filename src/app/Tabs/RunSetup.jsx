'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import Cookies from 'js-cookie'
import React, { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import { z } from 'zod'

const getRunSetupSchema = (instrumentType) => z.object({
  run_id: z.string().min(1, 'Run ID is required'),
  seq_run_date: z.string().min(1, 'Sequence run date is required'),
  total_gb_available: z.string().min(0.00001, 'Total GB available is required'),
  instument_type: z.string().min(0.00001, 'Instrument type is required'),
  pool_size: z.number().min(0.00001, 'Pool size is required'),
  pool_conc_run_setup: z.string().min(0.00001, 'Pool concentration is required'),
  nm_cal: z.number().min(0.00001, 'nM calibration is required'),
  total_required: z.number().min(0.00001, 'Total required is required'),
  final_pool_vol_ul: z.number().min(0.00001, 'Final pool volume (ul) is required'),
  // flowcell: z.string().min(0.00001, 'Flowcell is required'),
  ...(instrumentType === 'NextSeq_550' && {
    dinatured_lib_next_seq_550: z.number().min(0.00001, 'Stock Conc(pM) is required'),
    total_volume_next_seq_550: z.number().min(0.00001, 'Total Volume is required'),
    loading_conc_550: z.number().min(0.00001, 'Required Concentration(pM) is required'),
    lib_required_next_seq_550: z.number().min(0.00001, 'Volume from Stock is required'),
    buffer_volume_next_seq_550: z.number().min(0.00001, 'HT Buffer is required'),
    final_pool_conc_vol_2nm_next_seq_550: z.number().min(0.00001, 'Volume for Final Pool conc 2nM is required'),
    // nfw_vol_2nm_next_seq_550: z.number().min(1, 'NFW (2nM) is required'),
  }),
  ...(instrumentType === 'NextSeq_1000_2000' && {
    final_pool_conc_vol_2nm_next_seq_1000_2000: z.number().min(0.00001, 'Volulme for Final Pool conc 2nM is required'),
    rsbetween_vol_2nm_next_seq_1000_2000: z.number().min(0.00001, 'RSB tween-20 (2nM) is required'),
    total_volume_2nm_next_seq_1000_2000: z.number().min(0.00001, 'Total Volume (2nM) is required'),
    vol_of_2nm_for_600pm_next_seq_1000_2000: z.number().min(0.00001, 'Volume of 2nM conc(600pM) is required'),
    vol_of_rs_between_for_600pm_next_seq_1000_2000: z.number().min(0.00001, 'Volume of RSB tween-20 (600pM) is required'),
    total_volume_600pm_next_seq_1000_2000: z.number().min(0.00001, 'Total Volume(600pM) is required'),
    loading_conc_1000_2000: z.number().min(0.00001, 'Loading Concentration(pM) is required'),
  }),
  // Add other fields as needed
});

const RunSetup = () => {
  const [testNames, setTestNames] = useState([]);
  const [poolData, setPoolData] = useState([]);
  const [selectedTestNames, setSelectedTestNames] = useState([]);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([]); // Track selected checkboxes
  const [size, setSize] = useState([]);
  const [allTestNames, setAllTestNames] = useState([]); // Store full objects for all test names
  const [percentage, setPercentage] = useState([]);
  const [avgSize, setAvgSize] = useState(0);
  const [InstrumentType, setInstrumentType] = useState('');
  const [runDetails, setRunDetails] = useState([]);
  const user = JSON.parse(Cookies.get('vide_user') || '{}');
  const [runDetailsWithSampleIds, setRunDetailsWithSampleIds] = useState([]);
  const [selectedPoolNos, setSelectedPoolNos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showAddInstrumentDialog, setShowAddInstrumentDialog] = useState(false);
  const [fetchFlowcells, setFetchFlowcells] = useState({}); // { name:{amount:'', gb:''}, ... }

  // dialog box
  const [instrumentName, setInstrumentName] = useState('');
  const [submittingInstument, setSubmittingInstument] = useState(false);
  const [showFlowcellForm, setShowFlowcellForm] = useState(false);
  const [flowcellName, setFlowcellName] = useState('');
  const [flowcellAmount, setFlowcellAmount] = useState('');
  const [flowcells, setFlowcells] = useState({}); // { name: { amount, gb }, ... }
  const [flowcellGB, setFlowcellGB] = useState('');


  const handleAddFlowcell = () => {
    if (flowcellName.trim() && flowcellAmount && flowcellGB) {
      setFlowcells(prev => ({
        ...prev,
        [flowcellName.trim()]: { amount: flowcellAmount, gb: flowcellGB }
      }));
      setFlowcellName('');
      setFlowcellAmount('');
      setFlowcellGB('');
      setShowFlowcellForm(false);
    }
  };

  const handleRemoveFlowcell = (name) => {
    setFlowcells(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleAddInstrument = async (e) => {
    e.preventDefault();
    setSubmittingInstument(true);
    try {
      const response = await axios.post('/api/instruments', { instrument_name: instrumentName, flowcell: flowcells });
      if (response.data.status === 200) {
        toast.success('Instrument added successfully');
        setInstrumentName('');
        setFlowcells({});
        setShowAddInstrumentDialog(false);
        toast.success('Instrument added successfully');
      } else {
        toast.error(response.data.message);
      }
    }
    catch (err) {
      console.error('Error adding instrument:', err);
      toast.error('Failed to add instrument. Please try again.');
    }
    finally {
      setSubmittingInstument(false);
    }
  }
  // dialog box ends

  const form = useForm({
    resolver: zodResolver(getRunSetupSchema(InstrumentType)),
    defaultValues: {
      // application: '',
      run_id: '',
      seq_run_date: '',
      total_gb_available: '',
      instument_type: '',
      flowcell: '',
      pool_size: '', // Ensure numeric default value
      pool_conc_run_setup: '',
      nm_cal: '',
      total_required: '',
      final_pool_vol_ul: '',
      selected_application: '',
      dinatured_lib_next_seq_550: 20,
      total_volume_next_seq_550: 1500, // Ensure numeric default value
      loading_conc_550: '', // Ensure numeric default value
      lib_required_next_seq_550: '', // Ensure numeric default value
      buffer_volume_next_seq_550: '', // Ensure numeric default value
      final_pool_conc_vol_2nm_next_seq_1000_2000: '', // Ensure numeric default value
      rsbetween_vol_2nm_next_seq_1000_2000: '', // Ensure numeric default value
      total_volume_2nm_next_seq_1000_2000: '', // Ensure numeric default value
      vol_of_2nm_for_600pm_next_seq_1000_2000: '', // Ensure numeric default value
      vol_of_rs_between_for_600pm_next_seq_1000_2000: '', // Ensure numeric default value
      total_volume_600pm_next_seq_1000_2000: '', // Ensure numeric default value
      loading_conc_1000_2000: 600,
      total_volume_2nm_next_seq_550: '', // Ensure numeric default value
      final_pool_conc_vol_2nm_next_seq_550: '', // Ensure numeric default value
      nfw_vol_2nm_next_seq_550: '', // Ensure numeric default value
      table_data: [],
    },
  });

  const pool_conc_run_setup = form.watch("pool_conc_run_setup");
  const totalVolume2nMNextSeq550 = form.watch("total_volume_2nm_next_seq_550");
  const totalVolumeLoadingConc = form.watch("total_volume_600pm_next_seq_1000_2000");
  const loading_conc_1000_2000 = form.watch("loading_conc_1000_2000");
  const nMCal = form.watch("nm_cal");
  const totalVol2nM = form.watch("total_volume_2nm_next_seq_1000_2000");
  const dinatured_lib_next_seq_550 = form.watch("dinatured_lib_next_seq_550");
  const total_volume_next_seq_550 = form.watch("total_volume_next_seq_550");
  const loading_conc_550 = form.watch("loading_conc_550");


  const testColumns = [
    "WES",
    "Carrier Screening",
    "CES",
    "Myeloid",
    "HLA",
    "SGS",
    "WES + Mito",
    "HCP",
    "HRR",
    "CES + Mito",
    "Solid Tumor Panel",
    "Cardio Comprehensive (Screening)",
    "Cardio Metabolic Syndrome (Screening)",
    "Cardio Comprehensive Myopathy"
  ];

  useEffect(() => {
    const fetchTestNames = async () => {
      try {
        if (!user.hospital_name) {
          toast.error("Organization Name is missing");
          return;
        }

        const response = await axios.get(`/api/test-names?hospital_name=${user.hospital_name}`);
        // console.log('response', response.data);
        if (response.data[0].status === 200) {
          // console.log('test_names and sample ids', response.data[0].data);
          setTestNames(response.data[0].data);
          setAllTestNames(response.data[0].data); // Save full objects
        } else if (response.data[0].status === 404) {
          setTestNames([]);
          // console.log("No test names found for the provided Organization Name");
        }
      } catch (error) {
        console.error("Error fetching test names:", error);
      }
    };

    fetchTestNames();
  }, []);


  const handleTestNameChange = async (selectedTestName) => {
    try {
      if (!user.hospital_name || !selectedTestName) {
        // console.log("Organization Name or test name is missing");
        return;
      }

      // Prevent duplicates in the selectedTestName list
      if (selectedTestNames.includes(selectedTestName)) {
        // console.log("Test name already selected");
        return;
      }

      // Remove the selected test name from the dropdown
      setTestNames((prev) => prev.filter((test) => test.test_name !== selectedTestName));

      // Add the selected test name to the selected list
      const updatedSelectedTestNames = [...selectedTestNames, selectedTestName];
      setSelectedTestNames(updatedSelectedTestNames);

      // Update the selected_application field in the form state
      form.setValue("selected_application", updatedSelectedTestNames.join(", "));

      // --- NEW: Get sample_ids for this test_name ---
      // console.log('testNames', testNames);
      const testObj = testNames.find(t => t.test_name === selectedTestName);
      // console.log('testObj', testObj);
      const internalIdsParam = testObj && testObj.internal_ids && testObj.internal_ids.length > 0
        ? testObj.internal_ids.join(',')
        : '';

      // console.log('internalIdsParam', internalIdsParam);

      // Fetch pool data for the selected test name and sample_ids
      const response = await axios.get(
        `/api/pool-data?hospital_name=${user.hospital_name}&application=${selectedTestName}${internalIdsParam ? `&internal_id=${internalIdsParam}` : ''}`
      );
      // console.log('response', response.data);
      if (response.data[0].status === 200) {
        const poolDataForTest = response.data[0].data;
        // console.log('poolDataForTest', poolDataForTest);
        setPoolData((prev) => {
          // Remove any existing pool data for this test (and its + Mito variant)
          const filtered = prev.filter(
            (pool) =>
              pool.test_name !== selectedTestName &&
              pool.test_name !== `${selectedTestName} + Mito`
          );

          const combined = [...filtered, ...poolDataForTest];
          const uniqueByPoolNo = [];
          const seenPoolNos = new Set();
          for (const pool of combined) {
            if (!seenPoolNos.has(pool.pool_no)) {
              uniqueByPoolNo.push(pool);
              seenPoolNos.add(pool.pool_no);
            }
          }
          const selectedPoolNos = uniqueByPoolNo.map(pool => pool.pool_no);
          setSelectedPoolNos(selectedPoolNos);
          return [...filtered, ...poolDataForTest];
        });
      } else if (response.data[0].status === 404) {
        // console.log("No pool data found for the provided Organization Name and test name");
      }

      // Reset the application field in the form
      form.setValue("application", ""); // Reset the select value
    } catch (error) {
      console.log("Error fetching pool data:", error);
    }
  };

  const handleSubmit = async (data) => {
    setProcessing(true); // Set processing state to true
    try {
      if (!data.run_id) return toast.error("Run ID is required");
      const filteredPoolData = poolData.filter((pool) =>
        selectedTestNames.some(
          (test) => pool.test_name === test || pool.test_name === `${test} + Mito`
        )
      );

      const selectedSampleIds = filteredPoolData.map((pool) => pool.sample_id);
      const selectedInternalIds = filteredPoolData.map((pool) => pool.internal_id);

      const table_data = form.getValues("table_data") || [];

      const response = await axios.post('/api/run-setup', {
        setup: {
          ...data,
          change_by: user.email,
          table_data, // Use table_data from form state
          sample_ids: selectedSampleIds,
          hospital_name: user.hospital_name,
          internal_ids: selectedInternalIds,
        },
      });

      if (response.data[0].status === 200) {
        setProcessing(false); // Reset processing state
        toast.success("Run setup submitted successfully!");
        form.reset();
        form.setValue("total_gb_available", '0')
        form.setValue("final_pool_vol_ul", 0);
        form.setValue("pool_size", 0);
        setSelectedTestNames([]);
        setSelectedCheckboxes([]);
        localStorage.removeItem('runSetupForm'); // <-- clear localStorage here

        // --- Remove samples from libraryPreparationData ---
        const libraryData = JSON.parse(localStorage.getItem("libraryPreparationData") || "{}");
        Object.keys(libraryData).forEach(testName => {
          let testData = libraryData[testName];
          if (Array.isArray(testData)) {
            // Old format: array of rows
            testData = testData.filter(row => !selectedInternalIds.includes(row.internal_id));
            if (testData.length > 0) {
              libraryData[testName] = testData;
            } else {
              delete libraryData[testName];
            }
          } else if (testData && Array.isArray(testData.rows)) {
            // New format: { rows, pools }
            testData.rows = testData.rows.filter(row => !selectedInternalIds.includes(row.internal_id));
            // Remove from pools as well
            if (Array.isArray(testData.pools)) {
              testData.pools = testData.pools
                .map(pool => ({
                  ...pool,
                  sampleInternalIds: (pool.sampleInternalIds || []).filter(id => !selectedInternalIds.includes(id)),
                  sampleIndexes: (pool.sampleIndexes || []).filter(idx => {
                    const row = testData.rows[idx];
                    return row && !selectedInternalIds.includes(row.internal_id);
                  }),
                }))
                .filter(pool => pool.sampleInternalIds.length > 0);
            }
            // Remove testName if no rows and no pools left
            if ((testData.rows.length === 0) && (!testData.pools || testData.pools.length === 0)) {
              delete libraryData[testName];
            } else {
              libraryData[testName] = testData;
            }
          }
        });

        const selectedLibraryPrepSamples = JSON.parse(localStorage.getItem("selectedLibraryPrepSamples") || "[]");
        const updatedLibraryPrepSamples = selectedLibraryPrepSamples.filter(
          id => !selectedInternalIds.includes(id)
        );
        localStorage.setItem("selectedLibraryPrepSamples", JSON.stringify(updatedLibraryPrepSamples));

        localStorage.setItem("libraryPreparationData", JSON.stringify(libraryData));


        setPoolData([]);
        fetchRunDetails(); // Fetch updated run details after submission
      } else if (response.data[0].status === 404) {
        setProcessing(false); // Reset processing state
        toast.error(response.data[0].message || "No data found for the provided Organization Name and test name");
      }
    } catch (error) {
      setProcessing(false); // Reset processing state
      console.error("Error submitting form:", error);
      toast.error("An error occurred while submitting the form.");
    }
  };

  const validateTotalGbAvailable = () => {
    const totalRequired = form.getValues("total_required"); // Get the current value of total_required
    const totalGbAvailable = form.getValues("total_gb_available"); // Get the current value of total_gb_available

    if (Number(totalGbAvailable) < Number(totalRequired)) {
      // If total_gb_available is less than total_required, reset the field and show an error
      form.setValue("total_gb_available", 0);
      toast.error("Total GB available cannot be less than Total Required.");
    }
  };

  useEffect(() => {
    if (dinatured_lib_next_seq_550 && total_volume_next_seq_550 && loading_conc_550) {
      // console.log('dinatured_lib_next_seq_550', dinatured_lib_next_seq_550);
      const libReq = parseFloat((total_volume_next_seq_550 * loading_conc_550 / dinatured_lib_next_seq_550).toFixed(2));
      // console.log('libReq', libReq);
      // console.log('total_volume_next_seq_550', total_volume_next_seq_550);
      // console.log('loading_conc_550', loading_conc_550);
      form.setValue("lib_required_next_seq_550", libReq);
      const bufferVolume = parseFloat((total_volume_next_seq_550 - libReq).toFixed(2));

      form.setValue("buffer_volume_next_seq_550", bufferVolume);
    }
  }, [dinatured_lib_next_seq_550, total_volume_next_seq_550, loading_conc_550])


  useEffect(() => {
    if (nMCal && totalVol2nM) {
      const volumeForFinalPoolConc2nM = parseFloat((2 * totalVol2nM / nMCal).toFixed(2));
      form.setValue("final_pool_conc_vol_2nm_next_seq_1000_2000", volumeForFinalPoolConc2nM);
      const rsBetweenVol2nM = parseFloat((totalVol2nM - volumeForFinalPoolConc2nM).toFixed(2));
      form.setValue("rsbetween_vol_2nm_next_seq_1000_2000", rsBetweenVol2nM);
    }
  }, [nMCal, totalVol2nM])

  useEffect(() => {
    if (totalVolumeLoadingConc && loading_conc_1000_2000) {
      // console.log('loading_conc', loading_conc_1000_2000);
      const volOf2nmLoadingConc = parseFloat((loading_conc_1000_2000 * totalVolumeLoadingConc / 2000).toFixed(2));
      form.setValue("vol_of_2nm_for_600pm_next_seq_1000_2000", volOf2nmLoadingConc);
      const volOfRsBetweenLoadingConc = parseFloat((totalVolumeLoadingConc - volOf2nmLoadingConc).toFixed(2));
      form.setValue("vol_of_rs_between_for_600pm_next_seq_1000_2000", volOfRsBetweenLoadingConc);
    }
  }, [totalVolumeLoadingConc, loading_conc_1000_2000]);

  useEffect(() => {
    const volumeForFinalPoolConc2nM = parseFloat((2 * totalVolume2nMNextSeq550 / nMCal).toFixed(2));
    form.setValue("final_pool_conc_vol_2nm_next_seq_550", volumeForFinalPoolConc2nM);
    const rnfwVol2nM = parseFloat((totalVolume2nMNextSeq550 - volumeForFinalPoolConc2nM).toFixed(2));
    form.setValue("nfw_vol_2nm_next_seq_550", rnfwVol2nM);
  }, [totalVolume2nMNextSeq550, nMCal]);

  const handleCheckboxChange = (testName, isChecked) => {
    let updatedCheckboxes;
    let updatedPoolNos;

    if (isChecked) {
      updatedCheckboxes = [...selectedCheckboxes, testName];
      const poolNosForTest = poolData
        .filter((pool) => pool.test_name === testName || pool.test_name === `${testName} + Mito`)
        .map((pool) => pool.pool_no);

      updatedPoolNos = [...selectedPoolNos, ...poolNosForTest];
      setSelectedPoolNos(updatedPoolNos);
    } else {
      updatedCheckboxes = selectedCheckboxes.filter((name) => name !== testName);
      const poolNosToRemove = poolData
        .filter((pool) => pool.test_name === testName || pool.test_name === `${testName} + Mito`)
        .map((pool) => pool.pool_no);

      updatedPoolNos = selectedPoolNos.filter((no) => !poolNosToRemove.includes(no));
      setSelectedPoolNos(updatedPoolNos);
    }

    setSelectedCheckboxes(updatedCheckboxes);

    // Use updatedPoolNos for calculation, not selectedPoolNos
    const updatedSize = updatedCheckboxes.map(test => {
      // Find all pools for this test
      const pools = poolData.filter(
        p => p.test_name === test || p.test_name === `${test} + Mito`
      );
      // Try to find the first pool with a valid tapestation_size
      const poolWithTapestation = pools.find(
        p => Number(p.tapestation_size) && Number(p.tapestation_size) !== 0
      );
      if (poolWithTapestation) {
        return Number(poolWithTapestation.tapestation_size);
      }
      // Otherwise, use the first pool's size_for_2nm
      if (pools.length > 0) {
        return Number(pools[0].size_for_2nm);
      }
      return NaN;
    }).filter(size => !isNaN(size) && size > 0);

    // console.log('updatedSize', updatedSize);
    const avgSize = updatedSize.length > 0
      ? parseFloat((updatedSize.reduce((sum, size) => sum + size, 0) / updatedSize.length).toFixed(2))
      : 0;


    setAvgSize(avgSize); // Update the avgSize state

    const totalRequired = poolData
      .filter((pool) =>
        updatedCheckboxes.some(
          (test) => pool.test_name === test || pool.test_name === `${test} + Mito`
        )
      )
      .reduce((sum, pool) => sum + (pool.data_required || 0), 0); // Sum up the data_required values
    // console.log('total_required', totalRequired);

    form.setValue("total_required", totalRequired); // Update the total_required field in the form


    // Trigger validation for total_gb_available
    // validateTotalGbAvailable();
  };


  useEffect(() => {
    const totalGbAvailable = Number(form.watch("total_required"));

    if (totalGbAvailable > 0) {
      // Calculate unrounded percentages for each test
      const unroundedPercents = selectedCheckboxes.map(test => {
        const totalDataRequired = poolData
          .filter(pool => pool.test_name === test || pool.test_name === `${test} + Mito`)
          .reduce((sum, pool) => sum + (Number(pool.data_required) || 0), 0);
        return totalGbAvailable !== 0 ? (totalDataRequired / totalGbAvailable) * 100 : 0;
      });

      // Round each percentage individually (no forceful 100%)
      const roundedPercents = unroundedPercents.map(p => Number(p.toFixed(2)));

      const updatedPercentageData = selectedCheckboxes.map((test, idx) => ({
        test_name: test,
        percentage: roundedPercents[idx]
      }));

      setPercentage(updatedPercentageData);
    } else {
      setPercentage([]);
    }
  }, [form.watch("total_gb_available"), selectedCheckboxes, poolData]);

  // useEffect(() => {
  //   const totalGbAvailable = Number(form.watch("total_required"));

  //   if (totalGbAvailable > 0) {
  //     // Calculate unrounded percentages for each test
  //     const unroundedPercents = selectedCheckboxes.map(test => {
  //       const totalDataRequired = poolData
  //         .filter(pool => pool.test_name === test || pool.test_name === `${test} + Mito`)
  //         .reduce((sum, pool) => sum + (Number(pool.data_required) || 0), 0);
  //       return totalGbAvailable !== 0 ? (totalDataRequired / totalGbAvailable) * 100 : 0;
  //     });

  //     // Round all but last, last = 100 - sum of previous
  //     let roundedPercents = [];
  //     let sumRounded = 0;
  //     for (let i = 0; i < unroundedPercents.length; i++) {
  //       if (i < unroundedPercents.length - 1) {
  //         const rounded = Number(unroundedPercents[i].toFixed(2));
  //         roundedPercents.push(rounded);
  //         sumRounded += rounded;
  //       } else {
  //         // Last percentage: force to 100 - sum of previous
  //         const last = Number((100 - sumRounded).toFixed(2));
  //         roundedPercents.push(last);
  //       }
  //     }

  //     const updatedPercentageData = selectedCheckboxes.map((test, idx) => ({
  //       test_name: test,
  //       percentage: roundedPercents[idx]
  //     }));

  //     setPercentage(updatedPercentageData);
  //   } else {
  //     setPercentage([]);
  //   }
  // }, [form.watch("total_gb_available"), selectedCheckboxes, poolData]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      const avgSize = values.pool_size;
      const poolConc = values.pool_conc_run_setup;
      let nM = 0;
      if (avgSize && poolConc && !isNaN(avgSize) && !isNaN(poolConc)) {
        nM = parseFloat(((poolConc / (avgSize * 660)) * 1000000).toFixed(2));
      }
      // Only update if value is different
      if (form.getValues("nm_cal") !== nM) {
        form.setValue("nm_cal", nM);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (avgSize && !isNaN(avgSize)) {
      form.setValue("pool_size", avgSize); // Set the value programmatically

      form.trigger("pool_size"); // Trigger validation for the pool_size field
    }
  }, [avgSize]); // Watch for changes in avgSize


  useEffect(() => {
    // Collect all unique test names (including + Mito variants) present in poolData for selected tests
    const allTestVariants = [];
    selectedTestNames.forEach((test) => {
      if (poolData.some(pool => pool.test_name === test)) {
        allTestVariants.push(test);
      }
      if (poolData.some(pool => pool.test_name === `${test} + Mito`)) {
        allTestVariants.push(`${test} + Mito`);
      }
    });

    // Remove duplicates
    const uniqueTestVariants = [...new Set(allTestVariants)];

    const updatedTableData = uniqueTestVariants.map((test) => {
      const filteredPoolData = poolData.filter(pool => pool.test_name === test);

      let sampleCount = filteredPoolData.length;
      if (test === "Myeloid") {
        sampleCount = Math.ceil(sampleCount / 2);
      }
      const totalDataRequiredForTest = filteredPoolData
        .reduce((sum, pool) => sum + (pool.data_required || 0), 0);

      const percentageForTest = percentage
        .filter((item) => item.test_name === test)
        .reduce((sum, item) => sum + item.percentage, 0) || 0;

      const finalPoolVolUl = form.getValues("final_pool_vol_ul");
      const calculatedFinalPoolVolUl = parseFloat(((percentageForTest / 100) * finalPoolVolUl).toFixed(2));

      return {
        test_name: test,
        total_data_required: totalDataRequiredForTest,
        sample_count: sampleCount,
        percentage: percentageForTest,
        final_pool_volume_ul: calculatedFinalPoolVolUl,
      };
    });

    // console.log('table_data', updatedTableData);
    // console.log('table_data.json', JSON.stringify(updatedTableData));

    form.setValue("table_data", updatedTableData);
  }, [selectedTestNames, poolData, percentage, form.watch("final_pool_vol_ul")]);

  useEffect(() => {
    const saved = localStorage.getItem('runSetupForm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => {
          if (form.getValues(key) !== undefined) {
            form.setValue(key, parsed[key]);
          }
        });
        if (parsed.selectedTestNames) setSelectedTestNames(parsed.selectedTestNames);
        if (parsed.selectedCheckboxes) setSelectedCheckboxes(parsed.selectedCheckboxes);
        if (parsed.poolData) setPoolData(parsed.poolData);
        if (parsed.instument_type) setInstrumentType(parsed.instument_type);
      } catch (e) {
        console.error('Failed to parse run setup from localStorage', e);
      }
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem(
        'runSetupForm',
        JSON.stringify({
          ...values,
          selectedTestNames,
          selectedCheckboxes,
          poolData,
        })
      );
    });
    return () => subscription.unsubscribe();
  }, [form, selectedTestNames, selectedCheckboxes, poolData]);

  const fetchRunDetails = async () => {
    try {
      const response = await axios.get(`/api/run-setup?hospital_name=${user.hospital_name}&role=${user.role}`);
      // console.log('response', response.data);
      if (response.data[0].status === 200) {
        setRunDetails(response.data[0].data);
        // console.log('response.data[0].data', response.data[0].data);
      }
      if (response.data[0].status === 400) {
        toast.error(response.data[0].message || "No data found for the provided Organization Name");
      }
    }
    catch (e) {
      console.error('Error in RunSetup component:', e);
      // toast.error("An error occurred while loading the Run Setup component.");
    }
  }

  useEffect(() => {
    fetchRunDetails();
  }, [])


  const handleRunDetail = async (runId) => {
    try {
      const response = await axios.get(`/api/run-ids-data?runId=${runId}&hospital_name=${user.hospital_name}`);
      if (response.data[0].status === 200) {
        // console.log('response.data[0].data', response.data[0].data);
        setRunDetailsWithSampleIds(response.data[0].data);
      }
      else if (response.data[0].status === 404) {
        toast.error(response.data[0].message || "No data found for the provided run ID");
      }
    }
    catch (error) {
      console.log('error in handleRunDetail:', error);
    }
  }


  const fetchFlowcellsForInstrument = async (instrumentType) => {
    try {
      const response = await axios.get(`/api/instruments?instument_type=${instrumentType}`);
      if (
        response.data &&
        response.data.response &&
        response.data.response[0].status === 200
      ) {
        // Assuming only one instrument per type, or use response.data.response[0].data[0]
        const instrument = response.data.response[0].data[0];
        if (instrument && instrument.flowcell) {
          setFetchFlowcells(instrument.flowcell); // This will be your { name: { amount, gb }, ... }
        }
      } else {
        setFetchFlowcells({});
      }
    } catch (error) {
      setFetchFlowcells({});
      console.error("Failed to fetch flowcells:", error);
    }
  };

  const groupedByTest = runDetailsWithSampleIds.reduce((acc, item) => {
    if (!acc[item.test_name]) acc[item.test_name] = [];
    acc[item.test_name].push(item.sample_id);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-center bg-white dark:bg-gray-900">
        <div className="w-full max-w-3xl lg:max-w-5xl sm:max-w-2xl md:max-w-3xl mt-3">
          <h1 className='md:text-xl text-lg font-bold text-orange-400'>Run Setup</h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  // Prevent form submit on Enter
                  e.preventDefault();
                }
              }}
            >
              <div className="mt-4">
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* run_id */}
                  <FormField
                    control={form.control}
                    name="run_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Run ID</FormLabel>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter Run ID"
                          className="mb-2 border-2 w-full border-orange-300"
                          required
                        />
                        {form.formState.errors.run_id && (
                          <p className="text-red-500 text-sm">
                            {form.formState.errors.run_id.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <div></div>

                  {/* Application Dropdown */}
                  <FormField
                    control={form.control}
                    name="application"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Application</FormLabel>
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e); // Update form state
                            handleTestNameChange(e.target.value); // Fetch pool data and update state
                          }}
                          className="mb-2 w-full p-2 border-2 border-orange-300 rounded">
                          <option value="">Select application</option>
                          {testNames
                            .filter(test => !selectedTestNames.includes(test.test_name)) // <-- Filter out already selected
                            .map((test) => (
                              <option
                                key={test.test_name}
                                value={test.test_name}>
                                {test.test_name}
                              </option>
                            ))}
                        </select>
                      </FormItem>
                    )}
                  />

                  {/* final pool vol (ul) */}
                  <FormField
                    control={form.control}
                    name="final_pool_vol_ul"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Final Pool Volume (ul)</FormLabel>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter final pool volume (ul)"
                          value={field.value === 0 ? "" : field.value || ""} // Ensure valid numeric value
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} // Convert input to number
                          className="mb-2 border-2 w-full border-orange-300"
                          required
                        />
                        {form.formState.errors.final_pool_vol_ul && (
                          <p className="text-red-500 text-sm">
                            {form.formState.errors.final_pool_vol_ul.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Selected Applications */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="selected_application"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-2 p-2 overflow-x-auto">
                            {selectedTestNames && selectedTestNames.length > 0 ? (
                              <Table className="min-w-full">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Application</TableHead>
                                    <TableHead>Data Required (GB)</TableHead>
                                    <TableHead>%</TableHead>
                                    <TableHead>Final Pool Volume (ul)</TableHead>
                                    <TableHead>Add Data</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedTestNames.map((test) => {
                                    // Calculate the total data_required for the current test
                                    const totalDataRequiredForTest = poolData
                                      .filter((pool) =>
                                        pool.test_name === test ||
                                        pool.test_name === `${test} + Mito`
                                      )
                                      .reduce((sum, pool) => sum + (pool.data_required || 0), 0);
                                    {/* console.log('totalDataRequiredForTest', totalDataRequiredForTest); */ }

                                    // Get the percentage for the current test_name
                                    const percentageForTest = percentage
                                      .filter((pool) =>
                                        pool.test_name === test ||
                                        pool.test_name === `${test} + Mito`
                                      )
                                      .reduce((sum, item) => sum + item.percentage, 0) || 0;

                                    // Get the final pool volume (ul) from the input field
                                    const finalPoolVolUl = form.getValues("final_pool_vol_ul");

                                    // Calculate the final pool volume (ul) for the current test_name
                                    const calculatedFinalPoolVolUl = parseFloat(((percentageForTest / 100) * finalPoolVolUl).toFixed(2));

                                    return (
                                      <TableRow key={test}>
                                        <TableCell>{test}</TableCell>
                                        <TableCell>
                                          {totalDataRequiredForTest > 0 ? totalDataRequiredForTest.toFixed(2) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                          {Math.abs(percentageForTest - 100) < 0.0000000000001 ? "100%" : percentageForTest.toFixed(2) + "%"}
                                        </TableCell>
                                        <TableCell>
                                          {calculatedFinalPoolVolUl > 0 ? calculatedFinalPoolVolUl.toFixed(2) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="checkbox"
                                            name="select_application"
                                            className="w-[20px] h-[20px]"
                                            checked={selectedCheckboxes.includes(test)} // <-- controlled by state
                                            onChange={(e) => handleCheckboxChange(test, e.target.checked)} // Handle checkbox change
                                          />
                                        </TableCell>
                                        <TableCell
                                          className="cursor-pointer text-red-500"
                                          onClick={() => {
                                            setSelectedTestNames((prev) => prev.filter((name) => name !== test)); // Remove the test from selectedTestNames
                                            setSelectedCheckboxes((prev) => prev.filter((name) => name !== test)); // Remove the test from selectedCheckboxes
                                            setPoolData((prev) => prev.filter((pool) => pool.test_name !== test)); // Remove the pool data for the test
                                            form.setValue("selected_application", form.getValues("selected_application").replace(test, '').replace(/,,/g, ',').trim()); // Update selected_application field
                                            // send them to the applications
                                            setAvgSize(0); // Reset avgSize
                                            setTestNames((prev) => {
                                              // Only add if not already present
                                              if (prev.some(t => t.test_name === test)) return prev;
                                              // Find the full object from allTestNames
                                              const fullObj = allTestNames.find(t => t.test_name === test);
                                              if (!fullObj) return prev;
                                              return [...prev, fullObj];
                                            });
                                          }}
                                        >
                                          x
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            ) : null}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="total_required"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Total Required (GB)</FormLabel>
                        <Input
                          {...field}
                          value={field.value ?? 0}
                          type="number"
                          disabled
                          placeholder="Enter total required"
                          className="mb-2 w-full border-2 border-orange-300"
                        />
                      </FormItem>
                    )}
                  />

                  {/* total gb Available */}
                  <FormField
                    control={form.control}
                    name="total_gb_available"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Total Available (GB)</FormLabel>
                        <Input
                          {...field}
                          min="0"
                          required
                          value={field.value ?? 0}
                          onBlur={() => validateTotalGbAvailable()} // Trigger validation on blur
                          type="float"
                          placeholder="Enter total GB available"
                          className="mb-2 w-full border-2 border-orange-300"
                        />
                        {form.formState.errors.total_gb_available && (
                          <p className="text-red-500 text-sm">
                            {form.formState.errors.total_gb_available.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* sequnce run date*/}
                  <FormField
                    control={form.control}
                    name="seq_run_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Sequence Run Date</FormLabel>
                        <Input
                          {...field}
                          type="date"
                          className="mb-2 w-full border-2 border-orange-300"
                          required
                        />

                      </FormItem>
                    )}
                  />

                  {/* pool concentration */}
                  <FormField
                    control={form.control}
                    name="pool_conc_run_setup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Final Pool Concentration (Qubit)</FormLabel>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="any"
                          value={field.value !== undefined && !isNaN(field.value) ? field.value.toString() : "0"} // Ensure valid value
                          onChange={(e) => field.onChange(e.target.value === "" ? "0" : e.target.value)} // Handle empty input
                          placeholder="Enter pool concentration"
                          className="mb-2 w-full border-2 border-orange-300"
                        />
                      </FormItem>

                    )}
                  />

                  {/* pool size */}
                  <FormField
                    control={form.control}
                    name="pool_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Average Final Pool Size (Tapestation)</FormLabel>
                        <Input
                          {...field}
                          type="number"
                          step="any" // Allow decimal values
                          value={field.value !== undefined && !isNaN(field.value) ? field.value : ''} // Ensure valid value
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} // Convert input to number
                          placeholder="Enter pool size"
                          className="mb-2 w-full border-2 border-orange-300"
                        />
                        {form.formState.errors.pool_size && (
                          <p className="text-red-500 text-sm">
                            {form.formState.errors.pool_size.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />


                  {/* nM Calculation */}
                  <FormField
                    control={form.control}
                    name="nm_cal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Final Pool nM Concentration</FormLabel>
                        <Input
                          required
                          {...field}
                          value={field.value === 0 ? "" : field.value || ""}
                          type="number"
                          placeholder="Enter nM calculation"
                          className="mb-2 w-full border-2 border-orange-300"
                        />
                        {form.formState.errors.nm_cal && (
                          <p className="text-red-500 text-sm">
                            {form.formState.errors.nm_cal.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Instrument Type */}
                   <FormField
                    control={form.control}
                    name="instument_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Instrument Type</FormLabel>
                        <select
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e); // Update form state
                            setInstrumentType(e.target.value); // Update instrument type state

                            // Clear instrument-specific fields
                            if (e.target.value === "NextSeq_550") {
                              form.setValue("total_volume_2nm_next_seq_1000_2000", '');
                              form.setValue("final_pool_conc_vol_2nm_next_seq_1000_2000", '');
                              form.setValue("rsbetween_vol_2nm_next_seq_1000_2000", '');
                              form.setValue("loading_conc_1000_2000", 600);
                              form.setValue("total_volume_600pm_next_seq_1000_2000", '');
                              form.setValue("vol_of_2nm_for_600pm_next_seq_1000_2000", '');
                              form.setValue("vol_of_rs_between_for_600pm_next_seq_1000_2000", '');
                              // Optionally clear 550 fields too if you want a full reset
                            } else if (e.target.value === "NextSeq_1000_2000") {
                              form.setValue("total_volume_2nm_next_seq_550", '');
                              form.setValue("final_pool_conc_vol_2nm_next_seq_550", '');
                              form.setValue("nfw_vol_2nm_next_seq_550", '');
                              form.setValue("dinatured_lib_next_seq_550", 20);
                              form.setValue("total_volume_next_seq_550", 1500);
                              form.setValue("loading_conc_550", '');
                              form.setValue("lib_required_next_seq_550", '');
                              form.setValue("buffer_volume_next_seq_550", '');
                              // Optionally clear 1000/2000 fields too if you want a full reset
                            }
                          }}
                          className="mb-2 w-full p-2 border-2 border-orange-300 rounded"
                          required>
                          <option value="">Select instrument type</option>
                          <option value="NextSeq_550">NextSeq 550</option>
                          <option value="NextSeq_1000_2000">NextSeq 1000/2000</option>
                        </select>
                      </FormItem>
                    )}
                  /> 

                  {/* <FormField
                    control={form.control}
                    name="instument_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Instrument Type</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              className="w-full bg-white dark:bg-gray-900 border-2 border-orange-300 text-black dark:text-white text-left hover:bg-white justify-start"
                            >
                              {field.value === "NextSeq_550"
                                ? "NextSeq 550"
                                : field.value === "NextSeq_1000_2000"
                                  ? "NextSeq 1000/2000"
                                  : "Select instrument type"}
                              <span className="ml-2">&#9662;</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="min-w-[250px] mx-10">
                            <DropdownMenuItem
                              onClick={() => {
                                field.onChange("NextSeq_550");
                                setInstrumentType("NextSeq_550");
                                fetchFlowcellsForInstrument("NextSeq_550");
                                // Reset fields for NextSeq_550
                                form.setValue("total_volume_2nm_next_seq_1000_2000", '');
                                form.setValue("final_pool_conc_vol_2nm_next_seq_1000_2000", '');
                                form.setValue("rsbetween_vol_2nm_next_seq_1000_2000", '');
                                form.setValue("loading_conc_1000_2000", 600);
                                form.setValue("total_volume_600pm_next_seq_1000_2000", '');
                                form.setValue("vol_of_2nm_for_600pm_next_seq_1000_2000", '');
                                form.setValue("vol_of_rs_between_for_600pm_next_seq_1000_2000", '');
                              }}
                            >
                              NextSeq 550
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                field.onChange("NextSeq_1000_2000");
                                setInstrumentType("NextSeq_1000_2000");
                                fetchFlowcellsForInstrument("NextSeq_1000_2000");
                                // Reset fields for NextSeq_1000_2000
                                form.setValue("total_volume_2nm_next_seq_550", '');
                                form.setValue("final_pool_conc_vol_2nm_next_seq_550", '');
                                form.setValue("nfw_vol_2nm_next_seq_550", '');
                                form.setValue("dinatured_lib_next_seq_550", 20);
                                form.setValue("total_volume_next_seq_550", 1500);
                                form.setValue("loading_conc_550", '');
                                form.setValue("lib_required_next_seq_550", '');
                                form.setValue("buffer_volume_next_seq_550", '');
                              }}
                            >
                              NextSeq 1000/2000
                            </DropdownMenuItem>
                            {user.role === 'SuperAdmin' && (
                              <>
                                <div className="border-b border-gray-200 my-1" />
                                <DropdownMenuItem
                                  onClick={() => setShowAddInstrumentDialog(true)}
                                  className="text-blue-600 font-semibold"
                                >
                                  + Add Instrument
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flowcell"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2">Flowcell</FormLabel>
                        <select
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e)} // Update form state
                          className="mb-2 w-full p-2 border-2 border-orange-300 rounded"
                          required
                        >
                          <option value="">Select Flowcell</option>
                          {fetchFlowcells && Object.entries(fetchFlowcells).map(([name, { amount, gb }]) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </FormItem>
                    )}
                  /> */}

                  {InstrumentType && InstrumentType === 'NextSeq_550' ? (
                    <>

                      {/* total volume for 2nM */}
                      <FormField
                        control={form.control}
                        name='total_volume_2nm_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Total Volume (2nM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              onChange={e => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
                              placeholder="Enter Total Volume (2nM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                            {form.formState.errors.total_volume_2nm_next_seq_1000_2000 && (
                              <p className="text-red-500 text-sm">
                                {form.formState.errors.total_volume_2nm_next_seq_1000_2000.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* final pool conc vol for 2nM */}
                      <FormField
                        control={form.control}
                        name='final_pool_conc_vol_2nm_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Volume for Final Pool conc 2nM</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              placeholder="Enter Volume for Final Pool conc 2nM"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* NFW vol for 2nM */}
                      <FormField
                        control={form.control}
                        name='nfw_vol_2nm_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">NFW (2nM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              placeholder="Enter NFW (2nM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />
                      {/* dinatured */}
                      <FormField
                        control={form.control}
                        name='dinatured_lib_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Stock Conc(pM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              disabled
                              value={field.value ?? ""}
                              onChange={e => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
                              placeholder="Enter Stock Concentration"
                              className="mb-2 border-2 border-orange-300"
                            />
                            {form.formState.errors.dinatured_lib_next_seq_550 && (
                              <p className="text-red-500 text-sm">
                                {form.formState.errors.dinatured_lib_next_seq_550.message}
                              </p>
                            )}
                          </FormItem>

                        )}
                      />

                      {/* total volume */}
                      <FormField
                        control={form.control}
                        name='total_volume_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Total Volume</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              // value={1500}
                              disabled
                              value={field.value ?? 1500}
                              // onChange={e => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
                              placeholder="Enter Total Volume"
                              className="mb-2 border-2 border-orange-300"
                            />
                            {form.formState.errors.total_volume_next_seq_550 && (
                              <p className="text-red-500 text-sm">
                                {form.formState.errors.total_volume_next_seq_550.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Loading Conc */}
                      <FormField
                        control={form.control}
                        name='loading_conc_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Required Concentration(pM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              onChange={e => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
                              placeholder="Enter Required Concentration"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* lib required */}
                      <FormField
                        control={form.control}
                        name='lib_required_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Volume from Stock</FormLabel>
                            <Input
                              {...field}
                              value={field.value === 0 ? "" : field.value || ""}
                              type="number"
                              placeholder="Enter Volume from Stock"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* buffer volume */}
                      <FormField
                        control={form.control}
                        name='buffer_volume_next_seq_550'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2"> HT Buffer</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              placeholder="Enter HT Buffer"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                    </>
                  ) : ""}

                  {InstrumentType && InstrumentType === 'NextSeq_1000_2000' ? (
                    <>

                      {/* total volume for 2nM */}
                      <FormField
                        control={form.control}
                        name="total_volume_2nm_next_seq_1000_2000"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Total Volume (2nM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""} // Ensure valid numeric value
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} // Convert input to number
                              placeholder="Enter Total Volume (2nM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                            {form.formState.errors.total_volume_2nm_next_seq_1000_2000 && (
                              <p className="text-red-500 text-sm">
                                {form.formState.errors.total_volume_2nm_next_seq_1000_2000.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* final pool conc vol for 2nM */}
                      <FormField
                        control={form.control}
                        name='final_pool_conc_vol_2nm_next_seq_1000_2000'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Volulme for Final Pool conc 2nM</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""} // Ensure valid value
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              placeholder="Enter Volulme for Final Pool conc 2nM"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* RSBetween vol for 2nM */}
                      <FormField
                        control={form.control}
                        name='rsbetween_vol_2nm_next_seq_1000_2000'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">RSB tween-20 (2nM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""} // Ensure valid value
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              placeholder="Enter RSB tween-20 (2nM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* loading concentration */}
                      <FormField
                        control={form.control}
                        name='loading_conc_1000_2000'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Loading Concentration(pM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              placeholder="Enter Loading Concentration"
                              disabled
                              value={600}
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* total volume of 600pM */}
                      <FormField
                        control={form.control}
                        name='total_volume_600pm_next_seq_1000_2000'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Total Volume(600pM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              onChange={e => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
                              placeholder="Enter Total Volume(600pM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                            {form.formState.errors.total_volume_600pm_next_seq_1000_2000 && (
                              <p className="text-red-500 text-sm">
                                {form.formState.errors.total_volume_600pm_next_seq_1000_2000.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* vol for 2nM of the loading conc */}
                      <FormField
                        control={form.control}
                        name='vol_of_2nm_for_600pm_next_seq_1000_2000'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Volume of 2nM conc(600pM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              placeholder="Enter Volume of 2nM conc(600pM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />

                      {/* vol of RSBetween of loading conc */}
                      <FormField
                        control={form.control}
                        name='vol_of_rs_between_for_600pm_next_seq_1000_2000'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-2">Volume of RSB tween-20 (600pM)</FormLabel>
                            <Input
                              {...field}
                              type="number"
                              value={field.value === 0 ? "" : field.value || ""}
                              placeholder="Enter Volume of RSB tween-20 (600pM)"
                              className="mb-2 border-2 border-orange-300"
                            />
                          </FormItem>
                        )}
                      />



                    </>
                  ) : ""}


                </div>
                <div className='flex flex-row gap-4'>
                  <Button
                    type='reset'
                    className="w-1/2 mt-7 bg-gray-700 cursor-pointer text-white py-2 rounded hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      form.reset();
                      setPoolData([]);
                      setSelectedTestNames([]);
                      setSelectedCheckboxes([]);
                      setAvgSize(0);
                      setInstrumentType('');
                      setTestNames(allTestNames);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-1/2 mt-7 bg-gray-700 text-white py-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    {processing ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>

      </div>
      <div className="m-4 p-2">
        <h1 className='md:text-xl text-lg font-bold text-orange-400'>Run Details</h1>
        {runDetails && runDetails.length === 0 ? (
          <p className='text-center p-3 font-bold text-md md:text-lg'>No Run Details</p>
        ) : (
          <div className="flex flex-row gap-4 bg-white dark:bg-gray-900 rounded-lg shadow mb-6 overflow-x-auto w-full whitespace-nowrap" style={{ maxWidth: 'calc(100vw - 80px)' }}>
            {/* Left: Run Details Table */}
            <div className="w-1/2 max-w-[50%]">
              <div className="max-h-[70vh] overflow-y-auto w-full">
                <table className="min-w-full border-collapse table-auto">
                  <thead className="bg-orange-100 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 min-w-[120px] whitespace-nowrap">Run Name</th>
                      <th className="px-6 py-3 min-w-[120px] whitespace-nowrap">Run Date</th>
                      <th className="px-6 py-3 min-w-[160px] whitespace-nowrap">Instrument Type</th>
                      <th className="px-6 py-3 min-w-[160px] whitespace-nowrap">Run Sample Count</th>
                      <th className="px-6 py-3 min-w-[120px] whitespace-nowrap">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runDetails && runDetails.map((run, index) => (
                      <tr key={index} className="border-b text-center">
                        <td
                          className='p-3 underline cursor-pointer'
                          onClick={e => handleRunDetail(run.run_id)}
                        >{run.run_id}</td>
                        <td className='p-3'>
                          {run.seq_run_date
                            ? new Date(run.seq_run_date).toLocaleDateString('en-GB')
                            : ''}
                        </td>
                        <td className='p-3'>
                          {run.instument_type === 'NextSeq_550' ? 'NextSeq 550' : 'NextSeq 1000/2000'}
                        </td>
                        <td className='p-3'>
                          {run.count}
                        </td>
                        <td className='p-3'>
                          {run && run.run_remarks ? (
                            run.run_remarks
                          ) : (
                            <input
                              name='run_remarks'
                              type='text'
                              className='border-2 border-orange-300 rounded p-1 w-[150px] text-black dark:text-white'
                              placeholder='Enter remarks'
                              onBlur={async (e) => {
                                const value = e.target.value;
                                try {
                                  const response = await axios.put('/api/run-setup', {
                                    run_id: run.run_id,
                                    run_remarks: value,
                                  });
                                  if (response.data[0].status === 200) {
                                    fetchRunDetails(); // Refresh run details after saving remarks
                                  }
                                } catch (err) {
                                  console.log('error', err);
                                  toast.error("Failed to save remarks");
                                }
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Right: Run Samples Detail */}
            <div className="w-full">
              {runDetailsWithSampleIds && runDetailsWithSampleIds.length > 0 && (
                <div className="p-4 bg-white dark:bg-gray-900 rounded shadow mt-4">
                  <h2 className="font-bold text-orange-400 mb-2">Run Samples</h2>
                  <div>
                    <div className="font-bold mb-2">Run ID: {runDetailsWithSampleIds[0]?.run_id}</div>
                    <div className="flex flex-row gap-8 flex-wrap">
                      {Object.entries(groupedByTest).map(([testName, sampleIds]) => (
                        <div key={testName} className="mb-4 min-w-[200px]">
                          <div className="font-semibold mb-1">{testName}</div>
                          <div className="flex flex-col gap-1 ml-4">
                            {sampleIds.map((id, idx) => (
                              <span key={idx} className="text-gray-700 dark:text-gray-200">{id}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="font-bold mt-2">Count: {runDetailsWithSampleIds.length}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Add Instrument Dialog */}
      {/* <AddInstrument
        open={showAddInstrumentDialog}
        onOpenChange={setShowAddInstrumentDialog}
      /> */}
      {/* <AddInstrument
        open={showAddInstrumentDialog}
        onClose={() => setShowAddInstrumentDialog(false)}
      /> */}
      {/* {showAddInstrumentDialog && (
        <AddInstrument
          open={showAddInstrumentDialog}
          onClose={() => setShowAddInstrumentDialog(false)}
        />
      )} */}
      {/* {showAddInstrumentDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold">Dialog here</h2>
            <button
              onClick={() => setShowAddInstrumentDialog(false)}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )} */}

      {showAddInstrumentDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(255,255,255,0.6)', // semi-transparent white
            // WebkitBackdropFilter: 'blur(4px)',   // Safari support
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-11/12 md:w-1/2 lg:w-1/3">
            <h2 className="text-lg font-bold mb-4 text-black dark:text-white">Add New Instrument</h2>
            <form onSubmit={handleAddInstrument}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="instrumentName">Instrument Name</label>
                  <Input
                    id="instrumentName"
                    value={instrumentName}
                    onChange={(e) => setInstrumentName(e.target.value)}
                    className="w-full border-2 border-orange-300"
                  />
                </div>
                <div className="mb-4">
                  <Button
                    type="button"
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 cursor-pointer transition-colors"
                    onClick={() => setShowFlowcellForm(true)}
                  >
                    + Add Flowcell
                  </Button>

                  {showFlowcellForm && (
                    <div className="mt-2 flex gap-2 items-center">
                      <Input
                        placeholder="Flowcell Name"
                        value={flowcellName}
                        onChange={e => setFlowcellName(e.target.value)}
                        className="border-2 border-orange-300"
                      />
                      <Input
                        placeholder="GB"
                        type="number"
                        value={flowcellGB}
                        onChange={e => setFlowcellGB(e.target.value)}
                        className="border-2 border-orange-300"
                      />
                      <Input
                        placeholder="Amount"
                        type="number"
                        value={flowcellAmount}
                        onChange={e => setFlowcellAmount(e.target.value)}
                        className="border-2 border-orange-300"
                      />
                      <Button
                        type="button"
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 cursor-pointer"
                        onClick={handleAddFlowcell}
                        disabled={!flowcellName.trim() || !flowcellAmount || !flowcellGB}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 cursor-pointer"
                        onClick={() => setShowFlowcellForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {/* List of added flowcells */}
                  {Object.keys(flowcells).length > 0 && (
                    <div className="mt-2">
                      {Object.entries(flowcells).map(([name, { amount, gb }]) => (
                        <div key={name} className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-orange-100 dark:text-black border border-orange-300 rounded text-xs">
                            {name} (GB: {gb}) - ₹{amount}
                          </span>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveFlowcell(name)}
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-4 mt-4">
                <Button
                  type="reset"
                  variant="outline"
                  className="flex-1 bg-white text-gray-700 border dark:text-white cursor-pointer border-gray-300 hover:bg-gray-100 hover:text-black transition-colors"
                  onClick={() => {
                    setShowAddInstrumentDialog(false);
                    setInstrumentName('');
                    setFlowcells([]);
                    setFlowcellAmount('');
                    setFlowcellGB('');
                    setFlowcellName('');
                    setShowFlowcellForm(false);
                    setSubmittingInstument(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 text-white cursor-pointer hover:bg-orange-600 transition-colors"
                  disabled={submittingInstument}
                >
                  {submittingInstument ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />

    </div>
  );
};

export default RunSetup;


