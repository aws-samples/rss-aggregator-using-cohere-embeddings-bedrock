import './RssAggregator.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import ConfirmUser from './pages/ConfirmUser';

function App() {
  const isAuthenticated = () => {
    const accessToken = localStorage.getItem('accessToken');
    return !!accessToken;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUser/>} />
        <Route path="/home" element={isAuthenticated() ? <Home/> : <Navigate replace to="/login" />} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;
