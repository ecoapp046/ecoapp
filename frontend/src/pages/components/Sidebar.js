import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Droplets, 
  CheckSquare,
  MapPin, 
  Users, 
  Package, 
  MessageSquare, 
  Map as MapIcon, 
  LogOut, 
  Trash2,
  ClipboardEdit,
  Menu,
  X
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // State לניהול פתיחת התפריט במובייל
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'דשבורד', path: '/' },
    { icon: <Droplets size={20} />, label: 'מונים', path: '/meters' },
    { icon: <ClipboardEdit size={20} />, label: 'דיווח מהשטח', path: '/technician-report' },
    { icon: <CheckSquare size={20} />, label: 'משימות', path: '/tasks' }, 
    { icon: <MapPin size={20} />, label: 'יישובים', path: '/settlements' },
    { icon: <Users size={20} />, label: 'עובדים', path: '/workers' },
    { icon: <Package size={20} />, label: 'מחסן', path: '/storage' },
    { icon: <MessageSquare size={20} />, label: 'תלונות', path: '/tickets' },
    { icon: <MapIcon size={20} />, label: 'מפה', path: '/map' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setIsOpen(false); // סגירת תפריט לאחר ניווט במובייל
  };

  return (
    <>
      {/* כפתור המבורגר - צף ומופיע רק במובייל */}
      {isMobile && (
        <button onClick={toggleMenu} style={hamburgerButtonStyle}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* רקע כהה שקוף כשהתפריט פתוח במובייל */}
      {isMobile && isOpen && <div onClick={toggleMenu} style={overlayStyle} />}

      <aside style={{
        ...sidebarStyle,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(100%)') : 'none',
        transition: 'transform 0.3s ease-in-out',
        boxShadow: isMobile && isOpen ? '-5px 0 15px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* לוגו וכותרת */}
        <div 
          onClick={() => handleNavigate('/')} 
          style={{ ...logoSectionStyle, cursor: 'pointer' }}
        >
          <div style={logoIconStyle}>
            <Droplets color="white" size={24} />
          </div>
          <div style={logoTextContainer}>
            <div style={mainTitleStyle}>מערכת מים</div>
            <div style={subTitleStyle}>ניהול תשתיות</div>
          </div>
        </div>

        {/* תפריט ניווט */}
        <nav style={navStyle}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <div 
                key={index} 
                onClick={() => handleNavigate(item.path)} 
                style={isActive ? activeItemStyle : itemStyle}
              >
                <span style={iconStyle}>{item.icon}</span>
                <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* כפתורי תחתית */}
        <div style={footerStyle}>
          <div style={footerItemStyle} onClick={() => alert('מתנתק...')}>
            <LogOut size={18} /> <span>התנתקות</span>
          </div>
          <div style={{ ...footerItemStyle, color: '#ff6b6b' }}>
            <Trash2 size={18} /> <span>מחיקת חשבון</span>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- עיצוב (Styles) ---
const sidebarStyle = { 
  width: '240px', 
  height: '100vh', 
  backgroundColor: '#1a1f2b', 
  color: '#a0aec0', 
  display: 'flex', 
  flexDirection: 'column', 
  padding: '20px 0', 
  position: 'fixed', 
  right: 0, 
  top: 0, 
  borderLeft: '1px solid #2d3748', 
  zIndex: 1000,
  direction: 'rtl'
};

const hamburgerButtonStyle = {
  position: 'fixed',
  top: '10px',
  right: '10px', // בגלל שאנחנו ב-RTL, הצד הימני הוא הטבעי
  zIndex: 9999,  // הכי גבוה שיש כדי שלא יתחבא מאחורי כרטיסים
  backgroundColor: '#3182ce',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  cursor: 'pointer'
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.6)',
  zIndex: 999
};

const logoSectionStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  padding: '0 20px 40px 20px', 
  gap: '12px' 
};

const logoIconStyle = { 
  width: '35px', 
  height: '35px', 
  backgroundColor: '#3182ce', 
  borderRadius: '8px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center' 
};

const logoTextContainer = { textAlign: 'right' };
const mainTitleStyle = { color: 'white', fontWeight: 'bold', fontSize: '18px' };
const subTitleStyle = { fontSize: '12px', color: '#718096' };
const navStyle = { 
  flex: 1, 
  overflowY: 'auto', 
  paddingRight: '10px' 
};

const itemStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  padding: '12px 20px', 
  cursor: 'pointer', 
  transition: '0.2s', 
  fontSize: '15px',
  borderRadius: '8px 0 0 8px',
  marginBottom: '4px',
  marginLeft: '15px'
};

const activeItemStyle = { 
  ...itemStyle, 
  backgroundColor: 'rgba(49, 130, 206, 0.15)', 
  color: '#63b3ed', 
  borderRight: '4px solid #3182ce' 
};

const iconStyle = { display: 'flex', alignItems: 'center' };

const footerStyle = { 
  padding: '20px', 
  borderTop: '1px solid #2d3748', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px' 
};

const footerItemStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  fontSize: '14px', 
  cursor: 'pointer',
  transition: 'color 0.2s'
};

export default Sidebar;