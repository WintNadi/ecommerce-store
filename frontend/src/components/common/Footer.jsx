import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
} from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-500 dark:bg-navy-700 text-white transition-colors duration-200">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Description */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <span className="text-orange-400 mr-2">🏪</span> Shop Store
            </h3>
            <p className="text-white/70 mb-4 text-sm leading-relaxed">
              Your one-stop destination for quality products at the best prices. 
              We deliver happiness to your doorstep.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-white/50 hover:text-orange-400 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-white/50 hover:text-orange-400 transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-white/50 hover:text-orange-400 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-white/50 hover:text-orange-400 transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-white/50 hover:text-orange-400 transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white/60 hover:text-orange-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-white/60 hover:text-orange-400 transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/60 hover:text-orange-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/60 hover:text-orange-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/60 hover:text-orange-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/returns" className="text-white/60 hover:text-orange-400 transition-colors">
                  Returns Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-white/60 hover:text-orange-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/60 hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/60 hover:text-orange-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-white/60 hover:text-orange-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MdLocationOn className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/60">
                  123 Commerce Street,<br />
                  Yangon, Myanmar
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <MdEmail className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <a href="mailto:support@shopstore.com" className="text-white/60 hover:text-orange-400 transition-colors">
                  support@shopstore.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <MdPhone className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <a href="tel:+959123456789" className="text-white/60 hover:text-orange-400 transition-colors">
                  +959 123 456 789
                </a>
              </li>
            </ul>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <p className="text-sm text-white/70 mb-2">Subscribe to our newsletter</p>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded-l-lg bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-r-lg transition-colors text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-white/50">
            <p>
              &copy; {currentYear} Shop Store. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-2 sm:mt-0">
              <Link to="/privacy" className="hover:text-orange-400 transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-orange-400 transition-colors">
                Terms
              </Link>
              <Link to="/cookies" className="hover:text-orange-400 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;