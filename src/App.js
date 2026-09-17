
import './App.css';
import MobileVer from './Mobile/MobileVer';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Mobile from './Mobile/Mobile';
import Mypage from './Transactions/New_member_id_cards/Mypage';
import TransitionsModal from './Mobile/TransitionsModal';
import AadharVer from './Mobile/AadharVer';
import EkycCustomerPage from './Mobile/EkycCustomerPage';
import PaymentSuccess from './Transactions/New_member_id_cards/Paymentsuccess';


function getAppBasename() {
  if (typeof window === "undefined") return "";
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith("/vrudhitabenrollmentsg")) {
    return "/vrudhitabenrollmentsg";
  }
  if (pathname.startsWith("/vrudhitabenrollment")) {
    return "/vrudhitabenrollment";
  }
  return "";
}

function App() {
  const basename = getAppBasename();

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Mobile/>}/>
        {/* <Route path="/Mobile"  element={<Mobile/>}/> */}
        <Route path="/MobileVer" element={<MobileVer/>}/>
        <Route path="/TransitionsModal" element={<TransitionsModal/>}/>  
        <Route path="/AadharVer" element={<AadharVer/>}/>
        <Route path="/Mypage" element={<Mypage/>}/>
        <Route path="/ekyc-customer" element={<EkycCustomerPage/>}/>
        <Route path="/success-page/:linkId" element={<PaymentSuccess/>}/>
        <Route path="*" element={<Mobile/>}/>
      </Routes>
    </BrowserRouter> 
  );
};

export default App;
