import React from 'react';
import store from './store/store.js';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client'; 
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthLayout} from './components/index.js'
import './index.css';
import App from './App';

import Login from './pages/Login.jsx';
import Signup from './pages/SignUp.jsx';
import Home from './pages/Home.jsx';
import Account from './pages/Account.js';
import Admin from './pages/Admin.js'
import NearbyMunicipalities from './pages/NearbyMunicipalities.jsx';
import MunicipalityComplaints from './pages/MunicipalityComplaints.js';
import MunicipalityDashboard from './pages/MunicipalityDashboard.js';

import { UserProvider } from "./context/UserContext";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children: [
      {
        path:"/",
        element: <Home/>,
      },
      {
        path:"/login",
        element: (
          <AuthLayout authentication={false}>
            <Login/>
          </AuthLayout>
        )
      },
      {
          path: "/signup",
          element: (
              <AuthLayout authentication={false}>
                  <Signup />
              </AuthLayout>
          ),
      },
      {
        path: "/NearbyMunicipalities",
        element: (
          <AuthLayout authentication>
            {" "}
            <NearbyMunicipalities/>
          </AuthLayout>
        )
      },

      {
        path: "/admin/:id",
        element: (
          <AuthLayout authentication>
            <Admin />
          </AuthLayout>
        ),
      },

      
      {
          path: "/municipality/:id/complaints",
          element: (
              <AuthLayout authentication>
                  {" "}
                  <MunicipalityComplaints/>
              </AuthLayout>
          ),
      },
      // {
      //     path: "/about",
      //     element: (
      //         <AuthLayout authentication>
      //             {" "}
      //             <About/>
      //         </AuthLayout>
      //     ),
      // },
      {
          path: "/municipality/:id/dashboard",
          element: (
              <AuthLayout authentication>
                  {" "}
                  <MunicipalityDashboard/>
              </AuthLayout>
          ),
      },
      // {
      //     path: "/logout",
      //     element: (
      //         <AuthLayout authentication>
      //             {" "}
      //             <Gallery/>
      //         </AuthLayout>
      //     ),
      // },


        {
            path:"/profile",
            element:(
                <AuthLayout authentication>
                     {" "}
                     <Account/>
                </AuthLayout>
            ),
        },
    ]
  },
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </Provider>
  </React.StrictMode>
);
