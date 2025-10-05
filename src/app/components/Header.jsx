"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Menu, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const defaultAvatars = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/65.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/85.jpg",
  "https://randomuser.me/api/portraits/women/2.jpg",
];

const Header = ({ activeTab, setActiveTab }) => {
  const router = useRouter();
  const [user, setUser] = useState(null); // State to hold user data
  const menuRef = useRef(null); // Reference for the menu
  const [darkMode, setDarkMode] = useState(
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
  const fileInputRef = useRef(null); // Define the file input reference
  const [profilePhoto, setProfilePhoto] = useState(); // Default profile photo
  const [showMenu, setShowMenu] = useState(false); // State for avatar menu
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showTechnicianTabs, setShowTechnicianTabs] = useState(false);

  useEffect(() => {
    // Ensure a default user cookie exists (only set if not already present)
    const defaultUser = {
      username: "ankit",
      email: "ankit@strivebiocorp.com",
      hospital_name: "SOI",
      hospital_id: "101",
      role: "AdminUser",
      user_login: 57,
      name: "Ankit Bhadauriya",
      created_at: "2025-06-08T04:00:00.000Z",
      enable_management: "Yes"
    };
    if (typeof window !== "undefined" && !Cookies.get('vide_user')) {
      Cookies.set('vide_user', JSON.stringify(defaultUser), { expires: 7, path: '/' });
    }
    const rawCookie = Cookies.get('vide_user');
    if (rawCookie) {
      let parsedUser = null;
      try {
        parsedUser = JSON.parse(rawCookie);
      } catch (err) {
        console.error('Invalid vide_user cookie JSON', err);
        Cookies.remove('vide_user');
      }
      if (parsedUser) {
        setUser(parsedUser);
        const savedPhoto = localStorage.getItem('profilePhoto');
        if (savedPhoto) setProfilePhoto(savedPhoto); // Load saved profile photo from local storage
        const checkUserValidity = async () => {
          if (parsedUser.created_at) {
            const createAt = new Date(parsedUser.created_at);
            const now = new Date();
            const diffTime = Math.abs(now - createAt) / (1000 * 60 * 60 * 24 * 365); // Difference in years
            if (diffTime >= 1 && parsedUser.status === 'enable') {
              try {
                const res = await axios.put('/api/request-insert', { username: parsedUser.username, status: 'disable' });
                if (res.data[0].status === 200) {
                  router.push('/login');
                }
              } catch (error) {
                console.error('Error updating user status:', error);
              }
            }
          }
        }
        checkUserValidity();
      } else {
        router.push('/login');
      }
    }
    else {
      router.push('/login'); // Redirect to login if no user cookie found
    }
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  const handleAvatarClick = () => {
    setShowMenu(!showMenu); // Toggle the avatar menu
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target.result);
        localStorage.setItem('profilePhoto', e.target.result);
        event.target.value = ""; // <-- Reset the input value here!
      };
      reader.readAsDataURL(file);
    } else {
      event.target.value = ""; // Also reset if no file selected
    }
  };

  const handleChooseAvatar = (avatar) => {
    setProfilePhoto(avatar); // Set the selected avatar
    localStorage.setItem('profilePhoto', avatar); // Save to local storage
    setShowMenu(false); // Close the menu
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger the file input click
    }
  };

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        // Also check the avatar image/div
        !event.target.closest('.avatar-trigger')
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const getTabsForRole = (role) => {
    if (role === "manager" && showTechnicianTabs) {
      // Manager + Technician tabs
      return [
        // { value: "lab", label: "Lab" },
        { value: "sample-register", label: "Sample Registration" },
        { value: "processing", label: "Monitering" },
        { value: "library-prepration", label: "Library Preparation" },
        { value: "run-setup", label: "Run Setup" },
        { value: "reports", label: "Reports" },
      ];
    }
    switch (role) {
      case "technician":
        return [
          { value: "sample-register", label: "Sample Registration" },
          { value: "processing", label: "Monitering" },
          { value: "library-prepration", label: "Library Preparation" },
          { value: "run-setup", label: "Run Setup" },
          { value: "reports", label: "Reports" },
        ];
      case "manager":
        return [
          { value: "processing", label: "Monitering" },
          { value: "run-setup", label: "Run Setup" },
          { value: "reports", label: "Reports" },
        ];
      case "management":
        return [
          { value: "inventory", label: "Inventory Registration" }
        ];
      case "SuperAdmin":
      default:
        return [
          { value: "inventory", label: "Inventory Registration" },
          { value: "sample-register", label: "Sample Registration" },
          { value: "processing", label: "Monitering" },
          { value: "library-prepration", label: "Library Preparation" },
          { value: "run-setup", label: "Run Setup" },
          { value: "reports", label: "Reports" },
        ];
    }
  };

  // console.log('user', user);

  return (
    <header className="max-w-full bg-white border-2 sticky top-0 z-50 dark:bg-gray-900 py-4 shadow-md transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center px-2 max-w-full">
        {/* Title */}
        <div>
          <a
            href="/"
            className="xl:text-2xl lg:text-lg md:text-lg font-bold text-orange-500 break-words whitespace-normal max-w-[220px] sm:max-w-[350px] md:max-w-none"
          >
            Visualization Index and Dashboard Execution
          </a>

          <div>
            {user && (
              <div className='text-sm flex flex-wrap gap-3 justify-start text-gray-600 dark:text-gray-400'>
                <div>
                  {user.hospital_name || 'N/A'}
                </div>
                <div>
                  Organization ID: {user.hospital_id || 'N/A'}
                </div>
                <div>
                  Created At: {new Date(user.created_at).toLocaleDateString('en-GB') || 'N/A'}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tabs for xl+ screens */}
        <nav className="hidden xl:flex">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white dark:bg-gray-900 flex items-center space-x-4 transition-colors duration-300">
              {/* {user && user.enable_management === 'Yes' ?
                <div className='relative'>
                  <DropdownMenu className='hover:none'>
                    <DropdownMenuTrigger asChild className="bg-white dark:bg-gray-900 text-black dark:text-white shadow-none">
                      <Button
                        style={{ backgroundColor: 'inherit' }}
                        className="w-full text-left flex items-center justify-between data-[state=active]:bg-orange-400 data-[state=active]:text-white px-2 py-2 rounded"
                      >
                        Dashboard
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="flex flex-col min-w-[140px]">
                      <TabsTrigger value="management" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                        Management
                      </TabsTrigger>
                      <TabsTrigger value="run_planner" className="w-full text-left px-4 py-2  data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                        Run Planner
                      </TabsTrigger>
                      <TabsTrigger value="lab" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                        Lab
                      </TabsTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                :
                <TabsTrigger value="lab" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  Dashboard
                </TabsTrigger>
              } */}

              {/* <TabsTrigger value="inventory" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Inventory</TabsTrigger> */}

              <TabsTrigger value="sample-register" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Sample Registration</TabsTrigger>

              <TabsTrigger value="processing" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Monitoring</TabsTrigger>

              <TabsTrigger value="library-prepration" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Library Preparation</TabsTrigger>

              <TabsTrigger value="run-setup" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Run Setup</TabsTrigger>

              {/* <TabsTrigger value="reports" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Reports</TabsTrigger> */}

              {/* <TabsTrigger value="neofasq" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">NeoFastq</TabsTrigger> */}

              {/* <TabsTrigger value="help" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Help</TabsTrigger> */}
            </TabsList>
          </Tabs>
        </nav>

        {user && user.role === "manager" && (
          <Button
            variant="outline"
            size="sm"
            className="bg-orange-400 text-white hover:bg-orange-400 hover:text-white"
            onClick={() => setShowTechnicianTabs(prev => !prev)}
          >
            {showTechnicianTabs ? "Don't Show all tabs" : "Show all Tabs"}
          </Button>
        )}

        {/* Action buttons always visible */}
        <div className="flex space-x-2">
          <button onClick={toggleDarkMode} className="p-2 border-2 border-black dark:border-white rounded-lg cursor-pointer transition-colors duration-300">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative flex-shrink-0">
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoChange} />
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="avatar-trigger w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-gray-300 dark:border-white transition-colors duration-300"
                style={{ maxWidth: '40px', maxHeight: '40px' }}
                onClick={handleAvatarClick}
                title="Click to change profile photo"
              />
            ) : user && user.name ? (
              <div
                className="avatar-trigger w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-bold cursor-pointer border-2 border-gray-300 dark:border-white transition-colors duration-300"
                onClick={handleAvatarClick}
                title="Click to change profile photo"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div
                className="avatar-trigger w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white text-xl font-bold cursor-pointer border-2 border-gray-300 dark:border-white transition-colors duration-300"
                onClick={handleAvatarClick}
                title="Click to change profile photo"
              >?</div>
            )}

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 p-2 transition-colors duration-300">
                <div className="grid grid-cols-3 gap-2">
                  {defaultAvatars.map((avatar, idx) => (
                    <img key={idx} src={avatar} alt={`Avatar ${idx}`} className="w-10 h-10 rounded-full cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors duration-300" onClick={() => handleChooseAvatar(avatar)} />
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <button onClick={handleUploadClick} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-300">
                  Upload from device
                </button>

                <button
                  onClick={() => {
                    setProfilePhoto(undefined);
                    localStorage.removeItem('profilePhoto');
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-300 text-red-500"
                >
                  Remove photo
                </button>
              </div>
            )}

          </div>
          <button
            onClick={() => {
              Cookies.remove('vide_user');
              localStorage.removeItem('searchData');
              localStorage.removeItem('libraryPreparationData');
              localStorage.removeItem('runSetupForm');
              localStorage.removeItem('sampleRegistrationForm');
              localStorage.removeItem('editRowData');
              localStorage.removeItem('runSetupForm');
              localStorage.removeItem('reportsFilters');
              localStorage.removeItem('reportsData')
              localStorage.removeItem('processingFilters');
              router.push('/login');
            }}
            className="p-2 bg-red-500 text-white font-bold rounded-lg cursor-pointer transition-colors duration-300"
          >
            Logout
          </button>
          {user && user.role === "SuperAdmin" && (
            <button onClick={() => router.push('/login')} className="p-2 bg-orange-500 text-white font-bold rounded-lg cursor-pointer transition-colors duration-300">
              Assign User
            </button>
          )}

          {/* Hamburger for tabs on md/lg screens */}
          <div className="xl:hidden ">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 border-2 border-black dark:border-white rounded-lg cursor-pointer transition-colors duration-300"
              title="Open navigation"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
      {/* Hamburger drawer for tabs (md/lg screens) */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-opacity-40 z-[99] xl:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-[100]
             flex flex-col space-y-4 p-4 transition-transform duration-300 xl:hidden"
            style={{ minWidth: 240 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-orange-500">VIDE</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                setShowMobileMenu(false); // Close sidebar after tab change
              }}>


              <TabsList className="flex flex-col w-full flex-1 space-y-2 bg-white dark:bg-gray-900">
                {/* {user && user.enable_management === 'Yes' ?
                  <div className='relative'>
                    <DropdownMenu className='hover:none'>
                      <DropdownMenuTrigger asChild className="bg-white dark:bg-gray-900 text-black dark:text-white shadow-none">
                        <Button
                          style={{ backgroundColor: 'inherit' }}
                          className="w-full text-left flex items-center justify-between data-[state=active]:bg-orange-400 data-[state=active]:text-white px-2 py-2 rounded"
                        >
                          Dashboard
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="flex flex-col min-w-[140px]">
                        <TabsTrigger value="management" className="w-full text-left px-4 py-2  data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                          Management
                        </TabsTrigger>
                        <TabsTrigger value="run_planner" className="w-full text-left px-4 py-2  data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                          Run Planner
                        </TabsTrigger>
                        <TabsTrigger value="lab" className="w-full text-left px-4 py-2  data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                          Lab
                        </TabsTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  :
                  <TabsTrigger value="lab" className="w-full text-left px-4 py-2  data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                    Lab
                  </TabsTrigger>
                } */}


                {/* <TabsTrigger value="inventory" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Inventory Registration</TabsTrigger> */}

                <TabsTrigger value="sample-register" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">Sample Registration</TabsTrigger>

                <TabsTrigger value="processing" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">Monitering</TabsTrigger>

                <TabsTrigger value="library-prepration" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">Library Preparation</TabsTrigger>

                <TabsTrigger value="run-setup" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">Run Setup</TabsTrigger>

                {/* <TabsTrigger value="reports" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">Reports</TabsTrigger> */}

                {/* <TabsTrigger value="neofasq" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">NeoFastq</TabsTrigger> */}

                {/* <TabsTrigger value="help" className="w-full text-left data-[state=active]:bg-orange-400 data-[state=active]:text-white">Help</TabsTrigger> */}
              </TabsList>
            </Tabs>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;

{/* <nav className="hidden xl:flex">
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="bg-white dark:bg-gray-900 flex items-center space-x-4 transition-colors duration-300">
    <TabsTrigger value="dashboard" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Dashboard</TabsTrigger>

    <TabsTrigger value="sample-register" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Sample Registration</TabsTrigger>

    <TabsTrigger value="processing" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Processing</TabsTrigger>

    <TabsTrigger value="library-prepration" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Library Preparation</TabsTrigger>

    <TabsTrigger value="run-setup" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Run Setup</TabsTrigger>

    <TabsTrigger value="reports" className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white">Reports</TabsTrigger>
  </TabsList>
</Tabs>
</nav> */}


{/* Dashboard Dropdown */ }
// {
//   user && (
//     <>
//       {user.role === "SuperAdmin" && (
//         <div className='relative'>
//           <DropdownMenu className='hover:none'>
//             <DropdownMenuTrigger asChild className="bg-white dark:bg-gray-900 text-black dark:text-white shadow-none">
//               <Button
//                 style={{ backgroundColor: 'inherit' }}
//                 className="w-full text-left flex items-center justify-between data-[state=active]:bg-orange-400 data-[state=active]:text-white px-2 py-2 rounded"
//               >
//                 Dashboard
//                 <ChevronDown className="ml-2 h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="flex flex-col min-w-[140px]">
//               <TabsTrigger value="management" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
//                 Management
//               </TabsTrigger>
//               <TabsTrigger value="lab" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
//                 Lab
//               </TabsTrigger>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       )}
//       {user.role === "manager" && (
//         <TabsTrigger value="lab" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
//           Lab
//         </TabsTrigger>
//       )}
//       {user.role === "management" && (
//         <TabsTrigger value="management" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
//           Management
//         </TabsTrigger>
//       )}
//       {user.role === "technician" && (
//         <TabsTrigger value="lab" className="w-full text-left px-4 py-2 data-[state=active]:bg-orange-400 data-[state=active]:text-white">
//           Lab
//         </TabsTrigger>
//       )}
//     </>
//   )
// }

// {/* Render tabs based on role */ }
// {
//   user && getTabsForRole(user.role).map(tab => (
//     <TabsTrigger
//       key={tab.value}
//       value={tab.value}
//       className="cursor-pointer data-[state=active]:bg-orange-400 data-[state=active]:text-white"
//     >
//       {tab.label}
//     </TabsTrigger>
//   ))
// }
