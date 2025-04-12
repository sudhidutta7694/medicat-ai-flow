
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mediflow-container py-10">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="self-center text-2xl font-semibold whitespace-nowrap text-mediblue-600">🩺 MediFlow</span>
            </Link>
            <p className="mt-2 text-sm text-gray-600 max-w-md">
              HIPAA-compliant healthcare platform connecting physicians and patients through innovative AI assistance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase">Platform</h2>
              <ul className="text-gray-600">
                <li className="mb-2">
                  <Link to="/" className="hover:underline">Home</Link>
                </li>
                <li className="mb-2">
                  <Link to="/chat" className="hover:underline">AI Chat</Link>
                </li>
                <li className="mb-2">
                  <Link to="/timeline" className="hover:underline">Timeline</Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:underline">My Profile</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase">Support</h2>
              <ul className="text-gray-600">
                <li className="mb-2">
                  <a href="#" className="hover:underline">Help Center</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="hover:underline">Privacy</a>
                </li>
                <li>
                  <a href="#" className="hover:underline">Terms of Service</a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase">Contact</h2>
              <ul className="text-gray-600">
                <li className="mb-2">
                  <a href="mailto:support@mediflow.com" className="hover:underline">Email Us</a>
                </li>
                <li>
                  <a href="tel:+1-800-MEDIFLOW" className="hover:underline">Call Support</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-200" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center">
            © {new Date().getFullYear()} MediFlow. All Rights Reserved.
          </span>
          <div className="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <span className="sr-only">Facebook</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <span className="sr-only">Twitter</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
