import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './pages/components/Sidebar'; // וודא אות גדולה S
import MetersList from './pages/MetersList';
import TechnicianHome from './pages/TechnicianHome';
import MeterDetails from './pages/MeterDetails';
import Dashboard from './pages/Dashboard'; 
import TasksList from './pages/TasksList';
import { useIsMobile } from './hooks/useIsMobile';

function App() {
  const isMobile = useIsMobile();

  return (
    <Router>
      <div style={{ 
        display: 'flex', 
        direction: 'rtl', 
        minHeight: '100vh', 
        backgroundColor: '#f4f7fa',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
        {/* שינוי קריטי: הסיידבר תמיד מרונדר. הוא כבר יודע להסתתר לבד בפנים */}
        <Sidebar />

        <main style={{ 
          flex: 1, 
          // המרווח קיים רק בדסקטופ. במובייל התוכן תופס 100% רוחב
          marginRight: isMobile ? '0' : '240px', 
          padding: isMobile ? '10px' : '20px',
          minHeight: '100vh',
          width: '100%',
          boxSizing: 'border-box',
          // מניעת הסתרה של התוכן על ידי כפתור ההמבורגר במובייל (אופציונלי)
          marginTop: isMobile ? '50px' : '0' 
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meters" element={<MetersList />} />
            <Route path="/meter/:id" element={<MeterDetails />} />
            <Route path="/technician-report" element={<TechnicianHome />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;