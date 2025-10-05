import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: 'trf_pdfs', // optional folder
    },
    cloudinary.config().api_secret
  );

  res.json({
    signature,
    timestamp,
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
  });
}
// import {v2 as cloudinary } from 'cloudinary'

// cloudinary.config({
//     cloud_name:process.env.NEXT_PUBLIC_CLOUD_NAME,
//     api_key:process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,    
//     api_secret:process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
//     secure: true,
// })


// export default function handler(req, res) {
//     if (req.method !== 'POST') return res.status(405).end();
    
//     const timestamp = Math.floor(Date.now() / 1000);
    
//     const signature = cloudinary.utils.api_sign_request(
//         {
//             timestamp,
//             folder: 'trf_pdfs', // optional folder
//         },
//         cloudinary.config().api_secret
//     );
    
//     res.json({
//         signature,
//         timestamp,
//         apiKey: cloudinary.config().api_key,
//         cloudName: cloudinary.config().cloud_name,
//     });
// }

// export default cloudinary;