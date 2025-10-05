"use client";

import { store } from "@/lib/redux/store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "./components/Header";
import Processing from "./Tabs/Processing";
// import Reports from "./Tabs/Reports";
// import { SampleRegistration } from "./Tabs/SampleRegistration";
import LibraryPrepration from "./Tabs/LibraryPrepration";
import { setActiveTab } from "@/lib/redux/slices/tabslice";
import RunSetup from "./Tabs/RunSetup";
// import Inventory from "./Tabs/Inventory";
// import MangementDashboard from "./components/MangementDashboard";
// import Help from "./Tabs/Help";
// import CostCalculator from "./Tabs/RunPlanner";
// import NeoFastq from "./Tabs/NeoFastq";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/login" && pathname !== "/reset-password" && pathname !== "/format";

  return (
    <div className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex min-h-screen">
        <main className={`flex-grow transition-all duration-300`}>
          <Provider store={store}>
            <ReduxWrapper showSidebar={showSidebar} pathname={pathname}>
              {children}
            </ReduxWrapper>
          </Provider>
        </main>
      </div>
    </div>
  );
}

function ReduxWrapper({ children, showSidebar, pathname }) {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.tab.activeTab);

  useEffect(() => {
    let title = "VIDE";
    switch (activeTab) {
      case "management":
        title = "VIDE";
        break;
      case "lab":
        title = "VIDE";
        break;
      case "inventory":
        title = "VIDE";
        break;
      case "sample-register":
        title = "VIDE";
        break;
      case "processing":
        title = "VIDE";
        break;
      case "reports":
        title = "VIDE";
        break;
      case "library-prepration":
        title = "VIDE";
        break;
      case "run-setup":
        title = "VIDE";
        break;
      case "help":
        title = "VIDE";
        break;
      case "run_planner":
        title = "VIDE";
        break;
      case "neofasq":
        title = "VIDE";
        break;
      default:
        title = "VIDE";
    }
    document.title = title;
  }, [activeTab]);

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab)); // Dispatch action to change the tab
  };

  return (
    <>
      {showSidebar && (
        <Header activeTab={activeTab} setActiveTab={handleTabChange} />
      )}
      <div className="p-1">
        {/* Render login page if on /login */}
        {pathname === "/login" || pathname === "/reset-password" || pathname === "/format" ? (
          children
        ) : (
          <ReduxContent activeTab={activeTab} children={children} />
        )}
      </div>
    </>
  );
}

function ReduxContent({ children, activeTab }) {
  switch (activeTab) {
    // case "lab":
    //   return <>{children}</>;
    // case "management":
    //   return <MangementDashboard />;
    // case "run_planner":
    //   return <CostCalculator />;
    // case "inventory":
    //   return <Inventory />;
    // case "sample-register":
    //   return <SampleRegistration />;
    case "processing":
      return <Processing />;
    // case "reports":
    //   return <Reports />;
    case "sample-register":
      return <>{children}</>;
    case "library-prepration":
      return <LibraryPrepration />;
    case "run-setup":
      return <RunSetup />;
    // case "help":
    //   return <Help />;
    // case "neofasq":
    //   return <><NeoFastq/></>
    // default:
    //   return <>{children}</>;
  }
}

// "use client";

// import { store } from "@/lib/redux/store";
// import { Provider, useDispatch, useSelector } from "react-redux";
// import { usePathname } from "next/navigation";
// import { useEffect } from "react";
// import Header from "./components/Header";
// import Processing from "./Tabs/Processing";
// import Reports from "./Tabs/Reports";
// import { SampleRegistration } from "./Tabs/SampleRegistration";
// import LibraryPrepration from "./Tabs/LibraryPrepration";
// import { setActiveTab } from "@/lib/redux/slices/tabslice";
// import Runs from "./Tabs/Runs";

// export default function ClientLayout({ children }) {
//   const pathname = usePathname();
//   const showSidebar = pathname !== "/login" && pathname !== "/reset-password";

//   return (
//       <div className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
//         <div className="flex min-h-screen">
//           <main className={`flex-grow transition-all duration-300`}>
//             <Provider store={store}>
//               <ReduxWrapper showSidebar={showSidebar} pathname={pathname}>
//                 {children}
//               </ReduxWrapper>
//             </Provider>
//           </main>
//         </div>
//       </div>
//   );
// }

// function ReduxWrapper({ children, showSidebar, pathname }) {
//   const dispatch = useDispatch();
//   const activeTab = useSelector((state) => state.tab.activeTab);

//   useEffect(() => {
//     let title = "VIDE";
//     switch (activeTab) {
//       case "dashboard":
//         title = "VIDE";
//         break;
//       case "sample-register":
//         title = "VIDE";
//         break;
//       case "processing":
//         title = "VIDE";
//         break;
//       case "reports":
//         title = "VIDE";
//         break;
//       case "library-prepration":
//         title = "VIDE";
//         break;
//       case "run-setup":
//         title = "VIDE";
//         break;
//       default:
//         title = "VIDE";
//     }
//     document.title = title;
//   }, [activeTab]);

//   const handleTabChange = (tab) => {
//     dispatch(setActiveTab(tab)); // Dispatch action to change the tab
//   };

//   return (
//     <>
//       {showSidebar && (
//         <Header activeTab={activeTab} setActiveTab={handleTabChange} />
//       )}
//       <div className="p-1">
//         {/* Render login page if on /login */}
//         {pathname === "/login" || pathname === "/reset-password" ? (
//           children
//         ) : (
//           <ReduxContent activeTab={activeTab} children={children} />
//         )}
//       </div>
//     </>
//   );
// }

// function ReduxContent({ children, activeTab }) {
//   switch (activeTab) {
//     case "dashboard":
//       return <>{children}</>;
//     case "sample-register":
//       return <SampleRegistration />;
//     case "processing":
//       return <Processing />;
//     case "reports":
//       return <Reports />;
//     case "library-prepration":
//       return <LibraryPrepration />;
//     case "run-setup":
//       return <Runs />;
//     default:
//       return <>{children}</>;
//   }
// }