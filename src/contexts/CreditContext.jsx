import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CreditContext = createContext();

export const useCredits = () => {
    return useContext(CreditContext);
};

export const CreditProvider = ({ children }) => {
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshCredits = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/credits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setCredits(response.data.credits);
        } catch (error) {
            console.error('Failed to fetch credits:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    return (
        <CreditContext.Provider value={{ credits, loading, refreshCredits, setCredits }}>
            {children}
        </CreditContext.Provider>
    );
};
