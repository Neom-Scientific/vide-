'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

const FormSchema = z.object({
  sample_id: z.string().min(1, { message: "Sample ID is required" }),
  patient_name: z.string().min(1, { message: "Patient Name is required" }),
  selectedTestName: z.string().min(1, { message: "Test Type is required" }),
  sample_type: z.string().min(1, { message: "Sample Type is required" })
})

const SampleRegistration = () => {
  const [processing, setProcessing] = useState(false);
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
  const form = useForm({
    resolver: zodResolver(FormSchema),
  })
  const testOptions = [
    "WES",
    "Carrier Screening",
    "CES",
    "Cardio Comprehensive (Screening)",
    "Cardio Metabolic Syndrome (Screening)",
    "WES + Mito",
    "CES + Mito",
    "HRR",
    "HCP",
    "Cardio Comprehensive Myopathy",
    "Myeloid",
    "SGS",
    "HLA"
  ];

  const pad = n => n.toString().padStart(2, '0');
  const now = new Date();
  const currentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const handleReset = () => {
    form.reset({
      // hosptial and doctor information
      hospital_name: user?.hospital_name || '',
      hospital_id: user?.hospital_id || '',
      registration_date: currentDate,
      patient_name: '',
      sample_id: '',
      selectedTestName: '',
      sample_type: ''
    });
   
    localStorage.removeItem('sampleRegistrationForm');
    localStorage.removeItem('editRowData');
  }

  const onFormSubmit = async () => {
    setProcessing(true);

    // Set registration_date to current date-time string
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const currentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    form.setValue('registration_date', currentDate);

    // Get all form data
    const allData = form.getValues();
    console.log('allData', allData);

    const trimmedData = Object.fromEntries(
      Object.entries(allData).map(([key, value]) => {
        if (key === "age" && typeof value === "string" && /^\d+$/.test(value.trim())) {
          // If age is just an integer, append " year"
          return [key, `${value.trim()} year`];
        }
        return [key, typeof value === "string" ? value.trim() : value];
      })
    );

    // Prepare FormData for file + data
    const formData = new FormData();
    Object.entries(trimmedData).forEach(([key, value]) => {
      formData.append(key, value ?? '');
    });

    formData.append('hospital_id', user.hospital_id || '');
    formData.append('hospital_name', user.hospital_name || '');

    for (const [k, v] of formData.entries()) {
      console.log('formData', k, v);
    }

    // if (trfFiles) {
    //   formData.append('file', trfFiles);
    // }

    try {
      const res = await axios.post('/api/store', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data[0].status === 200) {
        toast.success('Sample registered successfully');
        form.reset();
        handleReset(); // Reset form and state
        setProcessing(false); // <-- Add this line to reset processing state

        // setSelectedTests([]);
        // setTrfUrl('');
        // setEditButton(false);
        // form.setValue('trf', '');
        // form.setValue('trf_file', '');
        // form.setValue('selectedTestName', '');
        // form.setValue('patient_name', '');
        // form.setValue('sample_id', '');
        // setCustomTestName('');
        // setTestToRemove('');
        // setShowRemoveModal(false);
        // setTestNameOptions([]);
        // setHasSelectedFirstTest(false);
      } else if (res.data[0].status === 400) {
        toast.error(res.data[0].message);
        setProcessing(false);
      } else {
        toast.error('Sample registration failed');
        setProcessing(false);
      }
    } catch (error) {
      console.log('Error during sample registration:', error);
      toast.error('Sample registration failed');
      setProcessing(false);
    }
  }

  const sampleTypeValues = [
    "EDTA Blood",
    "Plasma",
    "FFP",
    "cf BCT",
    "Fresh Tissue",
    "FFPE",
    "Buccal Swab",
    "Nails",
    "DNA",
    "RNA"
  ];

  return (
    <div className='p-4'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onFormSubmit)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              // Prevent form submit on Enter
              e.preventDefault();
            }
          }}
        >
          <FormField
            control={form.control}
            name='sample_id'
            render={({ field }) => (
              <FormItem className='my-2 flex-1'>
                <div className="flex justify-between items-center">
                  <FormLabel>Patient ID<span className='text-red-500'>*</span></FormLabel>
                  {form.formState.errors.sample_id && (
                    <p className='text-red-500 text-sm'>
                      {form.formState.errors.sample_id.message}
                    </p>
                  )}
                </div>
                <Input
                  placeholder='Patient ID'
                  className='my-2 border-2 border-orange-300 w-1/3'
                  {...field} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='patient_name'
            render={({ field }) => (
              <FormItem className='my-2 flex-1'>
                <div className="flex justify-between items-center">
                  <FormLabel>Sample Name<span className='text-red-500'>*</span></FormLabel>
                  {form.formState.errors.patient_name && (
                    <p className='text-red-500 text-sm'>
                      {form.formState.errors.patient_name.message}
                    </p>
                  )}
                </div>
                <Input
                  placeholder='Sample Name'
                  className='my-2 border-2 border-orange-300 w-1/3'
                  {...field} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='selectedTestName'
            render={({ field }) => (
              <FormItem className='my-2 flex-1'>
                <div className="flex justify-between items-center">
                  <FormLabel>Test Type<span className='text-red-500'>*</span></FormLabel>
                  {form.formState.errors.selectedTestName && (
                    <p className='text-red-500 text-sm'>
                      {form.formState.errors.selectedTestName.message}
                    </p>
                  )}
                </div>
                <select
                  className='my-2 border-2 border-orange-300 rounded-md p-2 w-1/3'
                  {...field}
                >
                  <option value="">Select Test Type</option>
                  {testOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='sample_type'
            render={({ field }) => (
              <FormItem className='my-2 flex-1'>
                <div className="flex justify-between items-center">
                  <FormLabel>Sample Type</FormLabel>
                  {form.formState.errors.sample_type && (
                    <p className='text-red-500 text-sm'>
                      {form.formState.errors.sample_type.message}
                    </p>
                  )}
                </div>
                <select
                  className='my-2 border-2 border-orange-300 rounded-md p-2 w-1/3'
                  {...field}
                >
                  <option value="">Select Sample Type</option>
                  {sampleTypeValues.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormItem>
            )}
          />
          {/* Add more form fields as needed */}

          <Button
            type='submit'
            className='mt-4 bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
            disabled={processing}
          >
            {processing ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </Form>
      {/* <form>
        <label htmlFor="sample_id">Sample ID</label><br/>
        <input
          className='my-2 border-2 border-orange-300 rounded-md'
          type="text"
          id="sample_id"
          placeholder="sample Id"
        /><br/>
        <label htmlFor="sample-name">Sample Name</label><br/>
        <input
          className='my-2 border-2 border-orange-300 rounded-md'
          type="text"
          id="sample-name"
          placeholder="sample name"
        /><br/>
        <label htmlFor="test_type">Test Type</label><br/>
        <select id="test_type" name="test_type">
          <option value="">Select Test Type</option>
          {testOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </form> */}
      <ToastContainer />
    </div>
  )
}

export default SampleRegistration