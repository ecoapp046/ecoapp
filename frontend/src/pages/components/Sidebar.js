import React, { useState, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);

  // מניעת גלילה של המסך כשהתפריט פתוח במובייל
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, isMobile]);

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

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* כפתור המבורגר במובייל */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={{
            ...hamburgerButtonStyle,
            backgroundColor: isOpen ? '#1a1f2b' : '#3182ce'
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* רקע כהה (Overlay) */}
      {isMobile && isOpen && (
        <div onClick={() => setIsOpen(false)} style={overlayStyle} />
      )}

      <aside style={{
        ...sidebarStyle,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(100%)') : 'none',
        width: isMobile ? '280px' : '240px', // תפריט מעט רחב יותר במובייל לשימוש נוח באגודל
      }}>
        
        {/* לוגו */}
        <div 
          onClick={() => handleNavigate('/')} 
          style={{ ...logoSectionStyle, cursor: 'pointer' }}
        >
          <div style={logoIconStyle}>
            <Droplets color="white" size={22} />
          </div>
          <div style={logoTextContainer}>
            <div style={mainTitleStyle}>מערכת מים</div>
            <div style={subTitleStyle}>ניהול ותפעול שטח</div>
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
                className="sidebar-item"
              >
                <span style={{ ...iconStyle, color: isActive ? '#63b3ed' : '#718096' }}>
                  {item.icon}
                </span>
                <span style={{ 
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'white' : 'inherit'
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* כפתורי תחתית */}
        <div style={footerStyle}>
          <div style={footerItemStyle} onClick={() => console.log('Logout')}>
            <LogOut size={18} /> <span>התנתקות</span>
          </div>
          {/* אפשרות למחיקת חשבון - בדרך כלל מוסתרת או בתוך הגדרות, אבל נשמור לפי העיצוב שלך */}
          <div style={{ ...footerItemStyle, color: '#f56565', fontSize: '12px', opacity: 0.7 }}>
            <Trash2 size={16} /> <span>מחיקת חשבון</span>
          </div>
        </div>
      </aside>

      {/* הוספת CSS פשוט לאפקט Hover (אופציונלי) */}
      <style>{`
        .sidebar-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
        }
      `}</style>
    </>
  );
};

// --- Styles (שינויים קלים לשיפור הנראות) ---
const sidebarStyle = { 
  height: '100vh', 
  backgroundColor: '#1a1f2b', 
  color: '#a0aec0', 
  display: 'flex', 
  flexDirection: 'column', 
  padding: '24px 0', 
  position: 'fixed', 
  right: 0, 
  top: 0, 
  zIndex: 1000,
  direction: 'rtl',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderLeft: '1px solid #2d3748'
};

const hamburgerButtonStyle = {
  position: 'fixed',
  top: '15px',
  right: '15px',
  zIndex: 10001,
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(3px)',
  zIndex: 999
};

const logoSectionStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  padding: '0 24px 32px 24px', 
  gap: '12px' 
};

const logoIconStyle = { 
  width: '38px', 
  height: '38px', 
  backgroundColor: '#3182ce', 
  borderRadius: '10px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const logoTextContainer = { textAlign: 'right' };
const mainTitleStyle = { color: 'white', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' };
const subTitleStyle = { fontSize: '11px', color: '#718096', marginTop: '-2px' };

const navStyle = { 
  flex: 1, 
  overflowY: 'auto', 
  padding: '0 12px' 
};

const itemStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  padding: '12px 16px', 
  cursor: 'pointer', 
  transition: 'all 0.2s', 
  fontSize: '15px',
  borderRadius: '10px',
  marginBottom: '4px'
};

const activeItemStyle = { 
  ...itemStyle, 
  backgroundColor: 'rgba(49, 130, 206, 0.2)', 
  color: '#63b3ed',
  boxShadow: 'inset -4px 0 0 #3182ce'
};

const iconStyle = { display: 'flex', alignItems: 'center', transition: 'color 0.2s' };

const footerStyle = { 
  padding: '20px 24px', 
  borderTop: '1px solid #2d3748', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '16px' 
};

const footerItemStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  fontSize: '14px', 
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

export default Sidebar;