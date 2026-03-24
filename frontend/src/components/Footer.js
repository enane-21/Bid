import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <footer className="bg-gray-800 text-white py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm">
                            © {currentYear} E-Bid System. All rights reserved.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Debre Tabor University
                        </p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-sm font-medium">
                            {currentDate}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Procurement Management System
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
