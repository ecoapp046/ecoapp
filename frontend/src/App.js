import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '/pages/components/Sidebar';
import MetersList from './pages/MetersList';
import TechnicianHome from './pages/TechnicianHome';
import MeterDetails from './pages/MeterDetails';
import Dashboard from './pages/Dashboard'; 
import TasksList from './pages/TasksList';
import { useIsMobile } from './hooks/useIsMobile';

// רכיב עזר שגורם לדף לקפוץ למעלה בכל מעבר נתיב
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  const isMobile = useIsMobile();

  return (
    <Router>
      <ScrollToTop />
      <div style={{ 
        display: 'flex', 
        direction: 'rtl', 
        minHeight: '100vh', 
        backgroundColor: '#f4f7fa',
        maxWidth: '100vw',
        overflowX: 'hidden',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        {/* הסיידבר מנהל את המצבים שלו פנימית */}
        <Sidebar />

        <main style={{ 
          flex: 1, 
          // מרווח ימני רק בדסקטופ עבור הסיידבר הקבוע
          marginRight: isMobile ? '0' : '240px', 
          padding: isMobile ? '15px' : '30px',
          minHeight: '100vh',
          width: '100%',
          boxSizing: 'border-box',
          // מרווח עליון במובייל כדי שהמבורגר לא יסתיר כותרות
          marginTop: isMobile ? '60px' : '0',
          transition: 'margin 0.3s ease'
        }}>
          {/* קונטיינר מרכזי עם רוחב מקסימלי לנראות מקצועית בדסקטופ רחב */}
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            width: '100%' 
          }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/meters" element={<MetersList />} />
              <Route path="/meter/:id" element={<MeterDetails />} />
              <Route path="/technician-report" element={<TechnicianHome />} />
              <Route path="/tasks" element={<TasksList />} />
              
              {/* נתיבי ברירת מחדל או דפי 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;