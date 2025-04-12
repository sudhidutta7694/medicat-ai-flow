
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, MessageSquare, Calendar, Home, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="mediflow-container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl text-mediblue-600 font-bold">🩺 MediFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-mediblue-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/chat" className="text-gray-700 hover:text-mediblue-600 px-3 py-2 rounded-md text-sm font-medium">
                AI Chat
              </Link>
              <Link to="/timeline" className="text-gray-700 hover:text-mediblue-600 px-3 py-2 rounded-md text-sm font-medium">
                Timeline
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-mediblue-600 px-3 py-2 rounded-md text-sm font-medium">
                My Profile
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <Button variant="outline" className="hidden md:flex">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
            
            {/* Mobile menu button */}
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile && isMenuOpen && (
          <nav className="pt-2 pb-3 border-t border-gray-200 mt-3">
            <Link to="/" className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-mediblue-600 hover:bg-gray-50">
              <Home className="mr-3 h-5 w-5" />
              Home
            </Link>
            <Link to="/chat" className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-mediblue-600 hover:bg-gray-50">
              <MessageSquare className="mr-3 h-5 w-5" />
              AI Chat
            </Link>
            <Link to="/timeline" className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-mediblue-600 hover:bg-gray-50">
              <Calendar className="mr-3 h-5 w-5" />
              Timeline
            </Link>
            <Link to="/profile" className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-mediblue-600 hover:bg-gray-50">
              <User className="mr-3 h-5 w-5" />
              My Profile
            </Link>
            <div className="px-3 py-3">
              <Button className="w-full">
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
