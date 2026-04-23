import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// ייבוא דפים (Pages)
import Sidebar from './pages/components/Sidebar';
import Dashboard from './pages/Dashboard';
import MetersList from './pages/MetersList';
import MeterDetails from './pages/MeterDetails';
import TasksList from './pages/TasksList';
import SettlementTasks from './pages/SettlementTasks';
import TaskDetails from './pages/TaskDetails'; 
import TechnicianHome from './pages/TechnicianHome';

// Hooks
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
        
        {/* תפריט צד */}
        <Sidebar />

        {/* תוכן מרכזי */}
        <main style={{ 
          flex: 1, 
          marginRight: isMobile ? '0' : '240px', 
          padding: isMobile ? '15px' : '30px',
          minHeight: '100vh',
          width: '100%',
          boxSizing: 'border-box',
          marginTop: isMobile ? '60px' : '0',
          transition: 'margin 0.3s ease'
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            width: '100%' 
          }}>
            <Routes>
              {/* דף הבית / דאשבורד ניהולי */}
              <Route path="/" element={<Dashboard />} />
              
              {/* ניהול מונים */}
              <Route path="/meters" element={<MetersList />} />
              <Route path="/meter/:id" element={<MeterDetails />} />
              
              {/* מערך משימות טכנאי */}
              <Route path="/tasks" element={<TasksList />} /> {/* בחירת יישוב */}
              <Route path="/tasks/:settlementName" element={<SettlementTasks />} /> {/* רשימת משימות ביישוב */}
              <Route path="/task/:taskId" element={<TaskDetails />} /> {/* דיווח מפורט על משימה בודדת */}
              
              {/* דיווח טכנאי כללי (אם עדיין בשימוש) */}
              <Route path="/technician-report" element={<TechnicianHome />} />
              
              {/* ניתוב ברירת מחדל במקרה של דף לא נמצא */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;